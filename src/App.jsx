import React, { useEffect, useMemo, useRef, useState } from "react";
import ContractForm from "./components/ContractForm";
import PaymentOutcome from "./components/PaymentOutcome";
import PaymentPending from "./components/PaymentPending";

const API_URL =
  "https://0fbd-2804-330-3054-e900-c810-a1a2-f4f2-d794.ngrok-free.app";
const HEADERS = {
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "true",
};

const plans = [
  {
    value: "MENSAL",
    label: "Mensal",
    price: "R$ 59,90",
    note: "Cobrança mensal",
  },
  {
    value: "SEMESTRAL",
    label: "Semestral",
    price: "R$ 300",
    note: "Equivale a R$ 50/mês",
  },
  {
    value: "ANUAL",
    label: "Anual",
    price: "R$ 516",
    note: "Melhor custo-benefício",
  },
];

const paymentMethods = [
  { value: "PIX", label: "Pix" },
  { value: "BOLETO", label: "Boleto" },
  { value: "CREDIT_CARD", label: "Cartão" },
];

const PROMO_PLAN = "MENSAL-PROMOCAO";
const FAILED_PAYMENT_STATUSES = new Set([
  "FAILED",
  "CANCELED",
  "OVERDUE",
  "REFUNDED",
  "CHARGEBACK",
  "DECLINED",
]);

function getInitialPlan() {
  if (typeof window === "undefined") return "MENSAL";

  const planFromQuery = new URLSearchParams(window.location.search)
    .get("plano")
    ?.toUpperCase();
  return plans.some((plan) => plan.value === planFromQuery) ||
    planFromQuery === PROMO_PLAN
    ? planFromQuery
    : "MENSAL";
}

const onlyNumbers = (value) => value.replace(/\D/g, "");

function formatCpf(numbers) {
  return numbers
    .slice(0, 11)
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

function formatCnpj(numbers) {
  return numbers
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, "$1.$2.$3/$4-$5");
}

function mask(value, type) {
  const numbers = onlyNumbers(value);

  if (type === "cep")
    return numbers
      .slice(0, 8)
      .replace(/^(\d{5})(\d{1,3})?/, (_, first, rest = "") =>
        rest ? `${first}-${rest}` : first,
      );
  if (type === "phone") {
    const sliced = numbers.slice(0, 11);
    if (sliced.length <= 2) return `(${sliced}`;
    if (sliced.length <= 6) return `(${sliced.slice(0, 2)}) ${sliced.slice(2)}`;
    if (sliced.length <= 10)
      return `(${sliced.slice(0, 2)}) ${sliced.slice(2, 6)}-${sliced.slice(6)}`;
    return `(${sliced.slice(0, 2)}) ${sliced.slice(2, 7)}-${sliced.slice(7)}`;
  }
  if (type === "card")
    return numbers.slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
  if (type === "validade")
    return numbers
      .slice(0, 6)
      .replace(/(\d{2})(\d{0,4})/, "$1/$2")
      .replace(/\/$/, "");
  if (type === "cvv") return numbers.slice(0, 4);
  if (type === "cpf") return formatCpf(numbers);
  if (type === "cpfCnpj") {
    if (numbers.length <= 11) return formatCpf(numbers);
    return formatCnpj(numbers);
  }

  return value;
}

const emptyForm = {
  nomeResponsavel: "",
  nomeEmpresa: "",
  cpfCnpj: "",
  email: "",
  telefone: "",
  cep: "",
  rua: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  cidadeNome: "",
  plano: "MENSAL",
  formaPagamento: "PIX",
  numeroCartao: "",
  nomeTitular: "",
  validade: "",
  cvv: "",
  cpfTitular: "",
};

export default function App() {
  const [form, setForm] = useState(() => ({
    ...emptyForm,
    plano: getInitialPlan(),
  }));
  const [errors, setErrors] = useState({});
  const [cities, setCities] = useState([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [copied, setCopied] = useState(false);
  const isCityLocked = cityLoading || cepLoading;
  const fieldRefs = useRef({});
  const isPromoPlan = form.plano === PROMO_PLAN;

  const selectedPlan = useMemo(
    () =>
      isPromoPlan
        ? {
            value: PROMO_PLAN,
            label: "Mensal",
            price: "R$ 29,90",
            note: "Primeira parcela. Depois R$ 59,90/mês.",
          }
        : plans.find((plan) => plan.value === form.plano) || plans[0],
    [form.plano, isPromoPlan],
  );

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({
      ...current,
      [field]: undefined,
      geral: undefined,
    }));
  }

  async function searchCities(search, uf = "") {
    setCityLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (uf) params.set("uf", uf);

      const response = await fetch(
        `${API_URL}/site/cidades?${params.toString()}`,
        { headers: HEADERS },
      );
      const data = await response.json();
      setCities(data.data || []);
      return data.data || [];
    } catch {
      setCities([]);
      return [];
    } finally {
      setCityLoading(false);
    }
  }

  useEffect(() => {
    const cep = onlyNumbers(form.cep);
    if (cep.length !== 8) return undefined;

    const timeout = setTimeout(async () => {
      setCepLoading(true);
      try {
        const response = await fetch(`${API_URL}/site/cep/${cep}`, {
          headers: HEADERS,
        });
        const payload = await response.json();
        const address = payload.data;

        if (!address) return;

        const foundCities = await searchCities(
          address.cidade || "",
          address.uf || "",
        );
        const bestCity = foundCities.find((city) =>
          city.nome
            .toLowerCase()
            .includes((address.cidade || "").toLowerCase()),
        );

        setForm((current) => ({
          ...current,
          rua: address.rua || current.rua,
          bairro: address.bairro || current.bairro,
          cidade: bestCity?.codigo ? String(bestCity.codigo) : current.cidade,
          cidadeNome: bestCity?.nome || address.cidade || current.cidadeNome,
        }));
      } catch {
        setErrors((current) => ({
          ...current,
          cep: "Não foi possível consultar este CEP.",
        }));
      } finally {
        setCepLoading(false);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [form.cep]);

  useEffect(() => {
    if (form.cidadeNome.trim().length < 2 || form.cidade) return;

    const timeout = setTimeout(() => {
      searchCities(form.cidadeNome.trim());
    }, 350);

    return () => clearTimeout(timeout);
  }, [form.cidadeNome, form.cidade]);

  useEffect(() => {
    if (!result?.id || result.pagamento?.pago) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `${API_URL}/site/consultar-pagamento/${result.id}`,
          { headers: HEADERS },
        );
        const data = await response.json();
        setPaymentStatus(data);
      } catch {
        setPaymentStatus((current) => current);
      }
    }, 7000);

    return () => clearInterval(interval);
  }, [result?.id, result?.pagamento?.pago]);

  function validate() {
    const nextErrors = {};

    if (!form.nomeResponsavel.trim())
      nextErrors.nomeResponsavel = "Informe o responsável.";
    if (!form.nomeEmpresa.trim()) nextErrors.nomeEmpresa = "Informe a empresa.";
    if (onlyNumbers(form.cpfCnpj).length < 11)
      nextErrors.cpfCnpj = "Informe um CPF ou CNPJ válido.";
    if (!/^\S+@\S+\.\S+$/.test(form.email))
      nextErrors.email = "Informe um e-mail válido.";
    if (onlyNumbers(form.telefone).length < 10)
      nextErrors.telefone = "Informe um telefone válido.";
    if (onlyNumbers(form.cep).length !== 8)
      nextErrors.cep = "Informe um CEP válido.";
    if (!form.rua.trim()) nextErrors.rua = "Informe a rua.";
    if (!form.numero.trim()) nextErrors.numero = "Informe o número.";
    if (!form.bairro.trim()) nextErrors.bairro = "Informe o bairro.";
    if (!form.cidade) nextErrors.cidadeNome = "Selecione uma cidade da lista.";

    if (form.formaPagamento === "CREDIT_CARD") {
      if (onlyNumbers(form.numeroCartao).length < 16)
        nextErrors.numeroCartao = "Informe o número do cartão.";
      if (!form.nomeTitular.trim())
        nextErrors.nomeTitular = "Informe o nome do titular.";
      if (onlyNumbers(form.validade).length < 6)
        nextErrors.validade = "Informe mês e ano.";
      if (onlyNumbers(form.cvv).length < 3) nextErrors.cvv = "Informe o CVV.";
      if (onlyNumbers(form.cpfTitular).length !== 11)
        nextErrors.cpfTitular = "Informe o CPF do titular.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const firstInvalidField = Object.keys(nextErrors)[0];
      requestAnimationFrame(() => {
        fieldRefs.current[firstInvalidField]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });
    }
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setResult(null);
    setPaymentStatus(null);

    try {
      const payload = {
        nomeResponsavel: form.nomeResponsavel.trim(),
        nomeEmpresa: form.nomeEmpresa.trim(),
        cpfCnpj: onlyNumbers(form.cpfCnpj),
        email: form.email.trim(),
        telefone: onlyNumbers(form.telefone),
        rua: form.rua.trim(),
        numero: form.numero.trim(),
        complemento: form.complemento.trim(),
        cidade: Number(form.cidade),
        cep: onlyNumbers(form.cep),
        bairro: form.bairro.trim(),
        plano: form.plano,
        formaPagamento: form.formaPagamento,
        origem: null,
      };

      if (form.formaPagamento === "CREDIT_CARD") {
        payload.dadosCartao = {
          numeroCartao: onlyNumbers(form.numeroCartao),
          nomeTitular: form.nomeTitular.trim().toUpperCase(),
          validade: form.validade,
          cvv: onlyNumbers(form.cvv),
          cpfTitular: onlyNumbers(form.cpfTitular),
        };
      }

      const response = await fetch(`${API_URL}/site/contratar`, {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        const apiError = data?.error || data?.mensagem || data?.message;
        throw new Error(apiError || "Não foi possível concluir a contratação.");
      }
      setResult(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setErrors({
        geral:
          (error && error.message) ||
          String(error) ||
          "Não foi possível concluir a contratação.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function selectCity(city) {
    update("cidade", String(city.codigo));
    update("cidadeNome", city.nome);
    setCities([]);
  }

  async function copyPix() {
    try {
      const pix =
        result?.pagamento?.pixCopiaCola ||
        paymentStatus?.pagamento?.pixCopiaCola;

      if (!pix) {
        console.log("PIX não encontrado");
        return;
      }

      await navigator.clipboard.writeText(pix);

      console.log("PIX copiado");

      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error("Erro ao copiar:", error);
    }
  }

  const payment = paymentStatus?.pagamento || result?.pagamento;
  const paid = Boolean(
    paymentStatus?.pagamento?.pago || result?.pagamento?.pago,
  );
  const paymentState = String(
    paymentStatus?.asaasStatus || payment?.status || "",
  ).toUpperCase();
  const failed = !paid && FAILED_PAYMENT_STATUSES.has(paymentState);

  return (
    <main className="min-h-screen bg-primary-50 text-gray-900">
      <header className="border-b border-primary-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <img className="h-9 w-auto" src="/icons/extenso.png" alt="CarFlow" />
          <span className="rounded-full bg-primary-50 px-3 py-1 text-sm font-semibold text-primary-700">
            Contratação segura
          </span>
        </div>
      </header>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-[1fr_320px]">
        {!result ? (
          <ContractForm
            form={form}
            errors={errors}
            fieldRefs={fieldRefs}
            plans={plans}
            paymentMethods={paymentMethods}
            isPromoPlan={isPromoPlan}
            cities={cities}
            isCityLocked={isCityLocked}
            cepLoading={cepLoading}
            submitting={submitting}
            onSubmit={handleSubmit}
            onUpdate={update}
            onMask={mask}
            onSelectCity={selectCity}
          />
        ) : failed ? (
          <PaymentOutcome isSuccess={false} />
        ) : paid ? (
          <PaymentOutcome isSuccess />
        ) : (
          <PaymentPending
            payment={payment}
            copied={copied}
            onCopyPix={copyPix}
          />
        )}

        <aside className="h-fit rounded-lg border border-primary-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-primary-900">Resumo</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-gray-600">Plano</dt>
              <dd className="font-semibold text-gray-950">
                {selectedPlan.label}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-gray-600">Valor</dt>
              <dd className="text-right font-semibold text-gray-950">
                <span className="block">{selectedPlan.price}</span>
                {selectedPlan.note ? (
                  <span className="mt-1 block text-xs font-medium text-gray-500">
                    {selectedPlan.note}
                  </span>
                ) : null}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-gray-600">Pagamento</dt>
              <dd className="font-semibold text-gray-950">
                {
                  paymentMethods.find(
                    (method) => method.value === form.formaPagamento,
                  )?.label
                }
              </dd>
            </div>
          </dl>
        </aside>
      </section>
    </main>
  );
}
