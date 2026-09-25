                .join(", "),
              order.shipping_complement,
              order.shipping_neighborhood,
              [order.shipping_city, order.shipping_state]
                .filter(Boolean)
                .join(" - "),
              order.shipping_zip_code,
            ]
              .filter(Boolean)
              .join(" · ");

            return (
              <article
                key={order.id}
                className="rounded-2xl border border-primary-light bg-white p-5 shadow-sm"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-text">
                      {customer?.full_name || customer?.email || "Cliente"}
                    </p>

                    {customer?.email && customer.full_name && (
                      <p className="text-xs text-text-muted">{customer.email}</p>
                    )}

                    {customer?.phone && (
                      <p className="text-xs text-text-muted">
                        {customer.phone}
                        {wa && (
                          <>
                            {" · "}
                            <a
                              href={wa}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary underline"
                            >
                              WhatsApp
                            </a>
                          </>
                        )}
                      </p>
                    )}

                    <p className="mt-0.5 text-xs text-text-muted">
                      Pedido #{orderNumber(order.id)} ·{" "}
                      {formatOrderDate(order.created_at)}
                    </p>
                  </div>

                  <span
                    className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${info.badge}`}
                  >
                    {info.label}
                  </span>
                </div>

                <div className="mb-3 space-y-2">
                  {(order.items ?? []).map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={itemImageUrl(item.product)}
                        alt={item.product?.title ?? "Peça"}
                        className="h-14 w-11 flex-shrink-0 rounded-lg bg-secondary object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm text-text">
                          {item.product?.title ?? "Peça"}
                          {item.product?.size ? ` (${item.product.size})` : ""}
                        </p>
                        <p className="text-xs text-text-muted">
                          {item.quantity} × {formatPrice(item.unit_price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {address && (
                  <p className="mb-3 text-sm text-text-muted">📍 {address}</p>
                )}

                {order.notes && (
                  <p className="mb-3 rounded-lg bg-secondary px-3 py-2 text-xs text-text-muted">
                    Obs.: {order.notes}
                  </p>
                )}

                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-primary">
                    {formatPrice(order.total_amount)}
                  </p>

                  <select
                    value={order.status}
                    disabled={savingId === order.id}
                    onChange={(e) =>
                      changeStatus(order, e.target.value as OrderStatus)
                    }
                    className="rounded-lg border border-primary-light bg-white px-2 py-1.5 text-xs disabled:opacity-60"
                  >
                    {STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>
                        {ADMIN_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </div>
              </article>
            );
          })}
        </div>
      )}

    </div>
  );
}
