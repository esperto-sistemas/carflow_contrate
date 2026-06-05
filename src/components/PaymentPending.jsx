import React from "react";

const SYSTEM_URL = "https://sistemas.caflow.app.br";

export default function PaymentPending({ payment, copied, onCopyPix }) {
  const pixQrCode = payment?.qrCodePix ? `data:image/png;base64,${payment.qrCodePix}` : null;

  return (
    <section className="">
      <div className="rounded-xl border border-primary-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">Pagamento pendente</p>
              <h2 className="mt-1 text-2xl font-bold text-primary-950">Contratação enviada</h2>
              <p className="mt-2 max-w-2xl text-sm text-gray-600">
                Seu acesso será liberado automaticamente após a confirmação do pagamento.
              </p>
            </div>
          </div>
          <span className="inline-flex w-fit items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-100">
            Aguardando pagamento
          </span>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_260px]">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary-700">Pagamento</h3>

            {payment?.pixCopiaCola ? (
              <div className="mt-3 rounded-lg border border-primary-100 bg-primary-50/50 p-4">
                <p className="text-sm font-semibold text-primary-900">Pix copia e cola</p>
                <textarea className="input mt-2 min-h-24 text-sm" readOnly value={payment.pixCopiaCola} />
                <button className="btn btn-primary mt-3" type="button" onClick={onCopyPix}>
                  {copied ? "Copiado" : "Copiar código Pix"}
                </button>
              </div>
            ) : null}

            {payment?.linhaDigitavelBoleto ? (
              <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h4 className="text-sm font-semibold text-gray-900">Boleto</h4>
                <p className="mt-2 break-all text-sm text-gray-700">{payment.linhaDigitavelBoleto}</p>
                {payment.pdfBoleto ? (
                  <a className="btn btn-primary mt-3 inline-flex" href={payment.pdfBoleto} target="_blank" rel="noreferrer">
                    Abrir boleto
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>

          {pixQrCode ? (
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm">
              <p className="text-sm font-semibold text-gray-900">Escaneie o QR Code Pix</p>
              <img
                className="mx-auto mt-3 w-full max-w-[220px] rounded-lg border border-gray-100 bg-white p-2"
                src={pixQrCode}
                alt="QR Code Pix para pagamento"
              />
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-500">
              QR Code indisponível para este pagamento.
            </div>
          )}
        </div>

       
      </div>
    </section>
  );
}
