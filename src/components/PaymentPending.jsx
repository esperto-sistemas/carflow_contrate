import React from "react";

const SYSTEM_URL = "https://sistema.carflow.app.br";

export default function PaymentPending({ payment, copied, onCopyPix }) {
  const pixQrCode = payment?.qrCodePix
    ? `data:image/png;base64,${payment.qrCodePix}`
    : null;

  const forma = (
    payment?.formaPagamento || payment?.formaPagamentoSelecionada || payment?.method || ""
  ).toString().toUpperCase();

  const pixBlock = (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* PIX COPIA E COLA */}
      {payment?.pixCopiaCola && (
        <div className="rounded-2xl border border-primary-100 bg-primary-50 p-5">
          <h3 className="text-base font-semibold text-primary-950">Pix Copia e Cola</h3>

          <p className="mt-2 text-sm text-primary-700">
            Caso prefira, copie o código abaixo e cole diretamente no
            aplicativo do seu banco.
          </p>

          <div className="mt-4 rounded-xl border border-primary-100 bg-white p-4">
            <p className="break-all text-xs leading-relaxed text-gray-700">
              {payment.pixCopiaCola}
            </p>
          </div>

          <button
            className="btn btn-primary mt-4 w-full"
            type="button"
            onClick={onCopyPix}
          >
            {copied ? "✓ Código copiado" : "Copiar código Pix"}
          </button>
        </div>
      )}

      {/* QR CODE */}
      <div className="rounded-2xl border border-primary-100 bg-white p-6 text-center shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">Escaneie o QR Code Pix</h3>

        <p className="mt-2 text-sm text-gray-500">
          Abra o aplicativo do seu banco e escaneie o código abaixo.
        </p>

        {pixQrCode ? (
          <img
            className="mx-auto mt-5 w-full max-w-[280px] rounded-xl border border-gray-100 bg-white p-3"
            src={pixQrCode}
            alt="QR Code Pix para pagamento"
          />
        ) : (
          <div className="mt-5 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-sm text-gray-500">
            QR Code indisponível para este pagamento.
          </div>
        )}
      </div>
    </div>
  );

  const boletoBlock = payment?.linhaDigitavelBoleto ? (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
      <div className="flex items-center gap-2">
        <span className="text-xl">📄</span>
        <h3 className="text-base font-semibold text-gray-900">Pagamento via Boleto</h3>
      </div>

      <p className="mt-3 text-sm text-gray-600">Linha digitável:</p>

      <div className="mt-2 rounded-xl border border-gray-200 bg-white p-4">
        <p className="break-all text-sm text-gray-700">{payment.linhaDigitavelBoleto}</p>
      </div>

      {payment.pdfBoleto && (
        <a
          className="btn btn-secondary mt-4 inline-flex w-full justify-center"
          href={payment.pdfBoleto}
          target="_blank"
          rel="noreferrer"
        >
          Abrir boleto
        </a>
      )}
    </div>
  ) : null;

  return (
    <section className="w-full">
      <div className="overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-sm">
        {/* Header */}
        <div className="border-b border-gray-100 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">
                Pagamento pendente
              </p>

              <h2 className="mt-1 text-2xl font-bold text-primary-950">
                Contratação enviada
              </h2>

              <p className="mt-2 max-w-2xl text-sm text-gray-600">
                Seu acesso será liberado automaticamente após a confirmação do
                pagamento.
              </p>
            </div>

            <div className="inline-flex items-center rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 ring-1 ring-amber-100">
              Aguardando pagamento
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Renderiza na ordem conforme forma de pagamento escolhida */}
            {forma === "BOLETO" ? (
              <>
                {boletoBlock}
                {pixBlock}
              </>
            ) : (
              <>
                {pixBlock}
                {boletoBlock}
              </>
            )}

            {/* Dados do pagamento */}
            {payment?.id && (
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs text-gray-500">
                  Identificador do pagamento
                </p>
                <p className="mt-1 font-mono text-sm text-gray-700">
                  {payment.id}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
