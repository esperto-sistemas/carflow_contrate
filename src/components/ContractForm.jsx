import React from "react";
import Spinner from "./Spinner";

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
  return <input className={`input ${error ? "border-red-400 ring-1 ring-red-200" : ""}`} {...props} />;
}

export default function ContractForm({
  form,
  errors,
  fieldRefs,
  plans,
  paymentMethods,
  isPromoPlan,
  cities,
  isCityLocked,
  cepLoading,
  submitting,
  onSubmit,
  onUpdate,
  onMask,
  onSelectCity,
}) {
  return (
    <form className="rounded-lg border border-primary-100 bg-white p-5 shadow-sm md:p-7" onSubmit={onSubmit}>
      <div className="mb-7">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">CarFlow</p>
        <h1 className="mt-1 text-3xl font-bold text-primary-900">Contrate o sistema</h1>
        <p className="mt-2 max-w-2xl text-gray-600">
          Preencha os dados da empresa e escolha a forma de pagamento para iniciar sua assinatura.
        </p>
      </div>

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
                onClick={() => onUpdate("plano", plan.value)}
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
              <TextInput autoComplete="name" placeholder="Nome de quem responde pela empresa" value={form.nomeResponsavel} error={errors.nomeResponsavel} onChange={(event) => onUpdate("nomeResponsavel", event.target.value)} />
            </Field>
          </div>
          <div ref={(node) => { fieldRefs.current.nomeEmpresa = node; }}>
            <Field label="Empresa" error={errors.nomeEmpresa}>
              <TextInput autoComplete="organization" placeholder="Nome fantasia ou razão social" value={form.nomeEmpresa} error={errors.nomeEmpresa} onChange={(event) => onUpdate("nomeEmpresa", event.target.value)} />
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
                onChange={(event) => onUpdate("cpfCnpj", onMask(event.target.value, "cpfCnpj"))}
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
                onChange={(event) => onUpdate("telefone", onMask(event.target.value, "phone"))}
              />
            </Field>
          </div>
          <div ref={(node) => { fieldRefs.current.email = node; }}>
            <Field label="E-mail" error={errors.email}>
              <TextInput autoComplete="email" placeholder="seuemail@empresa.com" value={form.email} error={errors.email} type="email" onChange={(event) => onUpdate("email", event.target.value)} />
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
                  onChange={(event) => onUpdate("cep", onMask(event.target.value, "cep"))}
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
              <TextInput autoComplete="address-line1" placeholder="Rua, avenida, alameda..." value={form.rua} error={errors.rua} onChange={(event) => onUpdate("rua", event.target.value)} />
            </Field>
          </div>
          <div className="md:col-span-2" ref={(node) => { fieldRefs.current.numero = node; }}>
            <Field label="Número" error={errors.numero}>
              <TextInput autoComplete="off" placeholder="123" value={form.numero} error={errors.numero} onChange={(event) => onUpdate("numero", event.target.value)} />
            </Field>
          </div>
          <div className="md:col-span-4">
            <Field label="Complemento" error={errors.complemento}>
              <TextInput autoComplete="address-line2" placeholder="Sala, bloco, fundos..." value={form.complemento} onChange={(event) => onUpdate("complemento", event.target.value)} />
            </Field>
          </div>
          <div className="md:col-span-3" ref={(node) => { fieldRefs.current.bairro = node; }}>
            <Field label="Bairro" error={errors.bairro}>
              <TextInput autoComplete="address-level3" placeholder="Centro" value={form.bairro} error={errors.bairro} onChange={(event) => onUpdate("bairro", event.target.value)} />
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
                    onUpdate("cidade", "");
                    onUpdate("cidadeNome", event.target.value);
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
                  <button className="block w-full px-3 py-2 text-left text-sm hover:bg-primary-50" key={city.codigo} type="button" onClick={() => onSelectCity(city)}>
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
              onClick={() => onUpdate("formaPagamento", method.value)}
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
                  onChange={(event) => onUpdate("numeroCartao", onMask(event.target.value, "card"))}
                />
              </Field>
            </div>
            <div className="md:col-span-3" ref={(node) => { fieldRefs.current.nomeTitular = node; }}>
              <Field label="Nome do titular" error={errors.nomeTitular}>
                <TextInput autoComplete="cc-name" placeholder="NOME COMO NO CARTÃO" value={form.nomeTitular} error={errors.nomeTitular} onChange={(event) => onUpdate("nomeTitular", event.target.value.toUpperCase())} />
              </Field>
            </div>
            <div className="md:col-span-2" ref={(node) => { fieldRefs.current.validade = node; }}>
              <Field label="Validade" error={errors.validade}>
                <TextInput autoComplete="cc-exp" value={form.validade} error={errors.validade} placeholder="12/2030" inputMode="numeric" maxLength={7} onChange={(event) => onUpdate("validade", onMask(event.target.value, "validade"))} />
              </Field>
            </div>
            <div className="md:col-span-2" ref={(node) => { fieldRefs.current.cvv = node; }}>
              <Field label="CVV" error={errors.cvv}>
                <TextInput autoComplete="cc-csc" placeholder="123" value={form.cvv} error={errors.cvv} inputMode="numeric" maxLength={4} onChange={(event) => onUpdate("cvv", onMask(event.target.value, "cvv"))} />
              </Field>
            </div>
            <div className="md:col-span-2" ref={(node) => { fieldRefs.current.cpfTitular = node; }}>
              <Field label="CPF do titular" error={errors.cpfTitular}>
                <TextInput autoComplete="off" placeholder="000.000.000-00" value={form.cpfTitular} error={errors.cpfTitular} inputMode="numeric" maxLength={14} onChange={(event) => onUpdate("cpfTitular", onMask(event.target.value, "cpf"))} />
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
    </form>
  );
}
