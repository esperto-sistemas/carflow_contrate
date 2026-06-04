import React, { useEffect, useMemo, useRef, useState } from "react";

const API_URL = "https://0fbd-2804-330-3054-e900-c810-a1a2-f4f2-d794.ngrok-free.app";
const HEADERS = {
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "true",
};

const plans = [
  { value: "MENSAL", label: "Mensal", price: "R$ 59,90", note: "Cobrança mensal" },
  { value: "SEMESTRAL", label: "Semestral", price: "R$ 300", note: "Equivale a R$ 50/mês" },
  { value: "ANUAL", label: "Anual", price: "R$ 516", note: "Melhor custo-benefício" },
];

const paymentMethods = [
  { value: "PIX", label: "Pix" },
  { value: "BOLETO", label: "Boleto" },
  { value: "CREDIT_CARD", label: "Cartão" },
];

const PROMO_PLAN = "MENSAL-PROMOCAO";

function getInitialPlan() {
  if (typeof window === "undefined") return "MENSAL";

  const planFromQuery = new URLSearchParams(window.location.search).get("plano")?.toUpperCase();
  return plans.some((plan) => plan.value === planFromQuery) || planFromQuery === PROMO_PLAN ? planFromQuery : "MENSAL";
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

  if (type === "cep") return numbers.slice(0, 8).replace(/^(\d{5})(\d{1,3})?/, (_, first, rest = "") => (rest ? `${first}-${rest}` : first));
  if (type === "phone") {
    const sliced = numbers.slice(0, 11);
    if (sliced.length <= 2) return `(${sliced}`;
    if (sliced.length <= 6) return `(${sliced.slice(0, 2)}) ${sliced.slice(2)}`;
    if (sliced.length <= 10) return `(${sliced.slice(0, 2)}) ${sliced.slice(2, 6)}-${sliced.slice(6)}`;
    return `(${sliced.slice(0, 2)}) ${sliced.slice(2, 7)}-${sliced.slice(7)}`;
  }
  if (type === "card") return numbers.slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
  if (type === "validade") return numbers.slice(0, 6).replace(/(\d{2})(\d{0,4})/, "$1/$2").replace(/\/$/, "");
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

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-gray-800">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-sm text-red-600">{error}</span> : null}
    </label>
  );
}

function TextInput({ error, ...props }) {
  return (
    <input
      className={`input ${error ? "border-red-400 ring-1 ring-red-200" : ""}`}
      {...props}
    />
  );
}

function Spinner({ className = "" }) {
  return (
    <svg className={`animate-spin text-primary-600 ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M12 2a10 10 0 0 1 10 10h-4a6 6 0 1 0-6 6v4a10 10 0 0 1 0-20Z"
      />
    </svg>
  );
}

export default function App() {
  const [form, setForm] = useState(() => ({ ...emptyForm, plano: getInitialPlan() }));
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
        ? { value: PROMO_PLAN, label: "Mensal", price: "R$ 29,90", note: "Primeira parcela. Depois R$ 59,90/mês." }
        : plans.find((plan) => plan.value === form.plano) || plans[0],
    [form.plano, isPromoPlan],
  );

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, geral: undefined }));
  }

  async function searchCities(search, uf = "") {
    setCityLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (uf) params.set("uf", uf);

      const response = await fetch(`${API_URL}/site/cidades?${params.toString()}`, { headers: HEADERS });
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
        const response = await fetch(`${API_URL}/site/cep/${cep}`, { headers: HEADERS });
        const payload = await response.json();
        const address = payload.data;

        if (!address) return;

        const foundCities = await searchCities(address.cidade || "", address.uf || "");
        const bestCity = foundCities.find((city) => city.nome.toLowerCase().includes((address.cidade || "").toLowerCase()));

        setForm((current) => ({
          ...current,
          rua: address.rua || current.rua,
          bairro: address.bairro || current.bairro,
          cidade: bestCity?.codigo ? String(bestCity.codigo) : current.cidade,
          cidadeNome: bestCity?.nome || address.cidade || current.cidadeNome,
        }));
      } catch {
        setErrors((current) => ({ ...current, cep: "Não foi possível consultar este CEP." }));
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
        const response = await fetch(`${API_URL}/site/consultar-pagamento/${result.id}`, { headers: HEADERS });
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

    if (!form.nomeResponsavel.trim()) nextErrors.nomeResponsavel = "Informe o responsável.";
    if (!form.nomeEmpresa.trim()) nextErrors.nomeEmpresa = "Informe a empresa.";
    if (onlyNumbers(form.cpfCnpj).length < 11) nextErrors.cpfCnpj = "Informe um CPF ou CNPJ válido.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = "Informe um e-mail válido.";
    if (onlyNumbers(form.telefone).length < 10) nextErrors.telefone = "Informe um telefone válido.";
    if (onlyNumbers(form.cep).length !== 8) nextErrors.cep = "Informe um CEP válido.";
    if (!form.rua.trim()) nextErrors.rua = "Informe a rua.";
    if (!form.numero.trim()) nextErrors.numero = "Informe o número.";
    if (!form.bairro.trim()) nextErrors.bairro = "Informe o bairro.";
    if (!form.cidade) nextErrors.cidadeNome = "Selecione uma cidade da lista.";

    if (form.formaPagamento === "CREDIT_CARD") {
      if (onlyNumbers(form.numeroCartao).length < 16) nextErrors.numeroCartao = "Informe o número do cartão.";
      if (!form.nomeTitular.trim()) nextErrors.nomeTitular = "Informe o nome do titular.";
      if (onlyNumbers(form.validade).length < 6) nextErrors.validade = "Informe mês e ano.";
      if (onlyNumbers(form.cvv).length < 3) nextErrors.cvv = "Informe o CVV.";
      if (onlyNumbers(form.cpfTitular).length !== 11) nextErrors.cpfTitular = "Informe o CPF do titular.";
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
        origem: 4,
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

      if (!response.ok) throw new Error(data.mensagem || data.message || "Não foi possível concluir a contratação.");
      setResult(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setErrors({ geral: error.message });
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
    const pix = result?.pagamento?.pixCopiaCola || paymentStatus?.pagamento?.pixCopiaCola;
    if (!pix) return;
    await navigator.clipboard.writeText(pix);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const payment = paymentStatus?.pagamento || result?.pagamento;
  const paid = Boolean(paymentStatus?.pagamento?.pago || result?.pagamento?.pago);

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
        <form className="rounded-lg border border-primary-100 bg-white p-5 shadow-sm md:p-7" onSubmit={handleSubmit}>
          <div className="mb-7">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">CarFlow</p>
            <h1 className="mt-1 text-3xl font-bold text-primary-900">Contrate o sistema</h1>
            <p className="mt-2 max-w-2xl text-gray-600">
              Preencha os dados da empresa e escolha a forma de pagamento para iniciar sua assinatura.
            </p>
          </div>

          {result ? (
            <section className="rounded-lg border border-primary-200 bg-primary-50 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm">
                  <img className="h-7 w-7 object-contain" src="/icons/icone.png" alt="CarFlow" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-primary-900">Contratação enviada</h2>
                  <p className="mt-2 text-gray-700">
                    Após o pagamento seu acesso será liberado automaticamente, acesse{" "}
                    <a className="font-semibold text-primary-700 underline" href="https://sistema.carflow.app.br" target="_blank" rel="noreferrer">
                      https://sistema.carflow.app.br
                    </a>{" "}
                    e faça o login usando seu número de telefone e o CPF/CNPJ como senha.
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-600">ID público: {result.id}</p>

              {paid ? (
                <div className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                  Pagamento confirmado.
                </div>
              ) : null}

              {payment?.pixCopiaCola ? (
                <div className="mt-5">
                  <h3 className="font-semibold text-primary-900">Pix copia e cola</h3>
                  <textarea className="input mt-2 min-h-24 text-sm" readOnly value={payment.pixCopiaCola} />
                  <button className="btn btn-primary mt-3" type="button" onClick={copyPix}>
                    {copied ? "Copiado" : "Copiar Pix"}
                  </button>
                </div>
              ) : null}

              {payment?.linhaDigitavelBoleto ? (
                <div className="mt-5">
                  <h3 className="font-semibold text-primary-900">Boleto</h3>
                  <p className="mt-1 break-all text-sm text-gray-700">{payment.linhaDigitavelBoleto}</p>
                  {payment.pdfBoleto ? (
                    <a className="btn btn-primary mt-3 inline-flex" href={payment.pdfBoleto} target="_blank" rel="noreferrer">
                      Abrir boleto
                    </a>
                  ) : null}
                </div>
              ) : null}

              {!paid ? (
                <p className="mt-5 text-sm text-gray-600">
                  Status atual: {paymentStatus?.asaasStatus || payment?.status || "aguardando pagamento"}.
                </p>
              ) : null}
            </section>
          ) : (
            <>
              <section className="space-y-4">
                <h2 className="section-title">Plano</h2>
                {isPromoPlan ? (
                  <div className="rounded-lg border border-primary-600 bg-primary-50 p-4 ring-2 ring-primary-100">
                    <span className="block font-bold text-primary-900">Mensal</span>
                    <span className="mt-2 block text-2xl font-bold text-gray-950">R$ 29,90</span>
                    <span className="mt-1 block text-sm text-gray-600">Primeira parcela. Depois R$ 59,90/mês.</span>
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-3">
                    {plans.map((plan) => (
                      <button
                        className={`rounded-lg border p-4 text-left transition ${
                          form.plano === plan.value
                            ? "border-primary-600 bg-primary-50 ring-2 ring-primary-100"
                            : "border-gray-200 bg-white hover:border-primary-300"
                        }`}
                        key={plan.value}
                        type="button"
                        onClick={() => update("plano", plan.value)}
                      >
                        <span className="block font-bold text-primary-900">{plan.label}</span>
                        <span className="mt-2 block text-2xl font-bold text-gray-950">{plan.price}</span>
                        <span className="mt-1 block text-sm text-gray-600">{plan.note}</span>
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <section className="mt-8 space-y-4">
                <h2 className="section-title">Dados da empresa</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div ref={(node) => { fieldRefs.current.nomeResponsavel = node; }}>
                    <Field label="Responsável" error={errors.nomeResponsavel}>
                    <TextInput autoComplete="name" placeholder="Nome de quem responde pela empresa" value={form.nomeResponsavel} error={errors.nomeResponsavel} onChange={(event) => update("nomeResponsavel", event.target.value)} />
                    </Field>
                  </div>
                  <div ref={(node) => { fieldRefs.current.nomeEmpresa = node; }}>
                    <Field label="Empresa" error={errors.nomeEmpresa}>
                    <TextInput autoComplete="organization" placeholder="Nome fantasia ou razão social" value={form.nomeEmpresa} error={errors.nomeEmpresa} onChange={(event) => update("nomeEmpresa", event.target.value)} />
                    </Field>
                  </div>
                  <div ref={(node) => { fieldRefs.current.cpfCnpj = node; }}>
                    <Field label="CPF/CNPJ" error={errors.cpfCnpj}>
                    <TextInput
                      autoComplete="off"
                      inputMode="numeric"
                      maxLength={18}
                      placeholder="000.000.000-00 ou 00.000.000/0000-00"
                      value={form.cpfCnpj}
                      error={errors.cpfCnpj}
                      onChange={(event) => update("cpfCnpj", mask(event.target.value, "cpfCnpj"))}
                    />
                    </Field>
                  </div>
                  <div ref={(node) => { fieldRefs.current.telefone = node; }}>
                    <Field label="Telefone" error={errors.telefone}>
                    <TextInput
                      autoComplete="tel"
                      inputMode="tel"
                      maxLength={15}
                      placeholder="(00) 00000-0000"
                      value={form.telefone}
                      error={errors.telefone}
                      onChange={(event) => update("telefone", mask(event.target.value, "phone"))}
                    />
                    </Field>
                  </div>
                  <div ref={(node) => { fieldRefs.current.email = node; }}>
                    <Field label="E-mail" error={errors.email}>
                    <TextInput autoComplete="email" placeholder="seuemail@empresa.com" value={form.email} error={errors.email} type="email" onChange={(event) => update("email", event.target.value)} />
                    </Field>
                  </div>
                </div>
              </section>

              <section className="mt-8 space-y-4">
                <h2 className="section-title">Endereço</h2>
                <div className="grid gap-4 md:grid-cols-6">
                  <div className="md:col-span-2" ref={(node) => { fieldRefs.current.cep = node; }}>
                    <Field label="CEP" error={errors.cep}>
                      <div className="relative">
                        <TextInput
                          autoComplete="postal-code"
                          inputMode="numeric"
                          maxLength={9}
                          placeholder="00000-000"
                          value={form.cep}
                          error={errors.cep}
                          onChange={(event) => update("cep", mask(event.target.value, "cep"))}
                        />
                        {cepLoading ? (
                          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                            <Spinner className="h-4 w-4" />
                          </span>
                        ) : null}
                      </div>
                    </Field>
                  </div>
                  <div className="md:col-span-4" ref={(node) => { fieldRefs.current.rua = node; }}>
                    <Field label="Rua" error={errors.rua}>
                      <TextInput autoComplete="address-line1" placeholder="Rua, avenida, alameda..." value={form.rua} error={errors.rua} onChange={(event) => update("rua", event.target.value)} />
                    </Field>
                  </div>
                  <div className="md:col-span-2" ref={(node) => { fieldRefs.current.numero = node; }}>
                    <Field label="Número" error={errors.numero}>
                      <TextInput autoComplete="off" placeholder="123" value={form.numero} error={errors.numero} onChange={(event) => update("numero", event.target.value)} />
                    </Field>
                  </div>
                  <div className="md:col-span-4">
                    <Field label="Complemento" error={errors.complemento}>
                      <TextInput autoComplete="address-line2" placeholder="Sala, bloco, fundos..." value={form.complemento} onChange={(event) => update("complemento", event.target.value)} />
                    </Field>
                  </div>
                  <div className="md:col-span-3" ref={(node) => { fieldRefs.current.bairro = node; }}>
                    <Field label="Bairro" error={errors.bairro}>
                      <TextInput autoComplete="address-level3" placeholder="Centro" value={form.bairro} error={errors.bairro} onChange={(event) => update("bairro", event.target.value)} />
                    </Field>
                  </div>
                  <div className="relative md:col-span-3" ref={(node) => { fieldRefs.current.cidadeNome = node; }}>
                    <Field label="Cidade" error={errors.cidadeNome}>
                      <div className="relative">
                        <TextInput
                          autoComplete="off"
                          placeholder="Digite e selecione sua cidade"
                          value={form.cidadeNome}
                          error={errors.cidadeNome}
                          onChange={(event) => {
                            update("cidade", "");
                            update("cidadeNome", event.target.value);
                          }}
                        />
                        {isCityLocked ? (
                          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                            <Spinner className="h-4 w-4" />
                          </span>
                        ) : null}
                      </div>
                    </Field>
                    {cities.length > 0 && !form.cidade && !isCityLocked ? (
                      <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-primary-100 bg-white shadow-lg">
                        {cities.map((city) => (
                          <button className="block w-full px-3 py-2 text-left text-sm hover:bg-primary-50" key={city.codigo} type="button" onClick={() => selectCity(city)}>
                            {city.nome}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </section>

              <section className="mt-8 space-y-4">
                <h2 className="section-title">Pagamento</h2>
                <div className="grid gap-3 md:grid-cols-3">
                  {paymentMethods.map((method) => (
                    <button
                      className={`rounded-lg border px-4 py-3 text-left font-semibold transition ${
                        form.formaPagamento === method.value
                          ? "border-primary-600 bg-primary-50 text-primary-900 ring-2 ring-primary-100"
                          : "border-gray-200 bg-white text-gray-700 hover:border-primary-300"
                      }`}
                      key={method.value}
                      type="button"
                      onClick={() => update("formaPagamento", method.value)}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>

                  {form.formaPagamento === "CREDIT_CARD" ? (
                  <div className="grid gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 md:grid-cols-6">
                    <div className="md:col-span-3" ref={(node) => { fieldRefs.current.numeroCartao = node; }}>
                      <Field label="Número do cartão" error={errors.numeroCartao}>
                        <TextInput
                          autoComplete="cc-number"
                          inputMode="numeric"
                          maxLength={19}
                          placeholder="0000 0000 0000 0000"
                          value={form.numeroCartao}
                          error={errors.numeroCartao}
                          onChange={(event) => update("numeroCartao", mask(event.target.value, "card"))}
                        />
                      </Field>
                    </div>
                    <div className="md:col-span-3" ref={(node) => { fieldRefs.current.nomeTitular = node; }}>
                      <Field label="Nome do titular" error={errors.nomeTitular}>
                        <TextInput autoComplete="cc-name" placeholder="NOME COMO NO CARTÃO" value={form.nomeTitular} error={errors.nomeTitular} onChange={(event) => update("nomeTitular", event.target.value.toUpperCase())} />
                      </Field>
                    </div>
                    <div className="md:col-span-2" ref={(node) => { fieldRefs.current.validade = node; }}>
                      <Field label="Validade" error={errors.validade}>
                        <TextInput autoComplete="cc-exp" value={form.validade} error={errors.validade} placeholder="12/2030" inputMode="numeric" maxLength={7} onChange={(event) => update("validade", mask(event.target.value, "validade"))} />
                      </Field>
                    </div>
                    <div className="md:col-span-2" ref={(node) => { fieldRefs.current.cvv = node; }}>
                      <Field label="CVV" error={errors.cvv}>
                        <TextInput autoComplete="cc-csc" placeholder="123" value={form.cvv} error={errors.cvv} inputMode="numeric" maxLength={4} onChange={(event) => update("cvv", mask(event.target.value, "cvv"))} />
                      </Field>
                    </div>
                    <div className="md:col-span-2" ref={(node) => { fieldRefs.current.cpfTitular = node; }}>
                      <Field label="CPF do titular" error={errors.cpfTitular}>
                        <TextInput autoComplete="off" placeholder="000.000.000-00" value={form.cpfTitular} error={errors.cpfTitular} inputMode="numeric" maxLength={14} onChange={(event) => update("cpfTitular", mask(event.target.value, "cpf"))} />
                      </Field>
                    </div>
                  </div>
                ) : null}
              </section>

              <button className="btn btn-primary mt-8 w-full justify-center py-3 text-base" disabled={submitting} type="submit">
                {submitting ? <Spinner className="mr-2 h-4 w-4 text-white" /> : null}
                {submitting ? "Enviando..." : "Finalizar contratação"}
              </button>

              {errors.geral ? (
                <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {errors.geral}
                </div>
              ) : null}
            </>
          )}
        </form>

        <aside className="h-fit rounded-lg border border-primary-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-primary-900">Resumo</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-gray-600">Plano</dt>
              <dd className="font-semibold text-gray-950">{selectedPlan.label}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-gray-600">Valor</dt>
              <dd className="text-right font-semibold text-gray-950">
                <span className="block">{selectedPlan.price}</span>
                {selectedPlan.note ? <span className="mt-1 block text-xs font-medium text-gray-500">{selectedPlan.note}</span> : null}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-gray-600">Pagamento</dt>
              <dd className="font-semibold text-gray-950">{paymentMethods.find((method) => method.value === form.formaPagamento)?.label}</dd>
            </div>
          </dl>
          <div className="mt-5 rounded-lg bg-primary-50 p-4 text-sm text-primary-800">
            Após o envio, o pagamento será criado no Asaas e exibido nesta página.
          </div>
        </aside>
      </section>
    </main>
  );
}
