import React from "react";

const SYSTEM_URL = "https://sistema.carflow.app.br";

function SuccessCheck() {
  return (
    <div className="success-check" aria-hidden="true">
      <svg viewBox="0 0 96 96" fill="none">
        <circle className="success-check-circle" cx="48" cy="48" r="42" />
        <path className="success-check-mark" d="M29 49.5 41.5 62 68 35" />
      </svg>
    </div>
  );
}

function FailureMark() {
  return (
    <div
      className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-100 text-red-700"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-12 w-12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M18 6 6 18M6 6l12 12"
        />
      </svg>
    </div>
  );
}

export default function PaymentOutcome({ isSuccess }) {
  if (isSuccess) {
    return (
      <section className="success-panel rounded-lg border p-5">
        <div className="text-center">
          <SuccessCheck />
          <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Pagamento confirmado
          </p>
          <h2 className="mt-2 text-3xl font-bold text-gray-950">
            Sua assinatura está ativa
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-gray-700">
            Seu acesso ao CarFlow foi liberado automaticamente. Entre no sistema
            usando seu telefone como login e os dígitos do CPF/CNPJ como senha
            inicial.
          </p>

          <div className="mx-auto mt-6 grid max-w-xl gap-3 rounded-lg border border-emerald-100 bg-white p-4 text-left shadow-sm md:grid-cols-2">
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Login
              </span>
              <span className="mt-1 block font-bold text-gray-950">
                Telefone cadastrado
              </span>
            </div>
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Senha inicial
              </span>
              <span className="mt-1 block font-bold text-gray-950">
                Dígitos do CPF/CNPJ
              </span>
            </div>
          </div>

          <a
            className="btn btn-primary mt-6 justify-center px-6 py-3 text-base"
            href={SYSTEM_URL}
            target="_blank"
            rel="noreferrer"
          >
            Acessar o sistema
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-red-200 bg-red-50">
      <div className="rounded-xl border border-red-100 bg-white p-6 text-center shadow-sm">
        <FailureMark />
        <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-red-700">
          Pagamento não confirmado
        </p>
        <h2 className="mt-2 text-2xl font-bold text-gray-950">
          Não foi possível concluir sua assinatura
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-gray-700">
          Houve uma falha na confirmação do pagamento. Gere uma nova cobrança na
          contratação ou entre em contato com o suporte para finalizar sua
          assinatura.
        </p>
      </div>
    </section>
  );
}
