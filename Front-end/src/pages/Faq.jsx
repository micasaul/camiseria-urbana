export default function PreguntasFrecuentes() {
    const faqs = [
      "¿Puedo hacer cambios o devoluciones? Por el momento, no realizamos cambios ni devoluciones. Te recomendamos revisar bien la guía de talles antes de confirmar tu compra.",
      "¿Cómo se realizan los envíos? Todos los envíos se realizan exclusivamente a través de Correo Argentino. Vas a recibir el número de seguimiento por mail una vez despachado tu pedido.",
      "¿Qué medios de pago aceptan? Actualmente, el único medio de pago disponible es Mercado Pago, para garantizar seguridad y rapidez en cada transacción.",
      "¿Hacen ventas mayoristas o por encargo? Por ahora, solo realizamos ventas minoristas a través del sitio web."
    ];
  
    return (
      <section className="sobre-nosotros">
        {/* Franja superior */}
        <div className="franja" />
  
        {/* Contenido */}
        <div className="container text-center">
          <h2>PREGUNTAS FRECUENTES</h2>
  
          {faqs.map((faq, index) => {
            // Separamos la pregunta de la respuesta usando el primer signo de pregunta
            const splitIndex = faq.indexOf("?") + 1;
            const question = faq.slice(0, splitIndex);
            const answer = faq.slice(splitIndex).trim();
  
            return (
              <p key={index} className="faq-parrafo mb-6">
                <strong className="faq-question">{question}</strong><br />
                {answer}
              </p>
            );
          })}
        </div>
  
        {/* Franja inferior */}
        <div className="franja" />
      </section>
    )
  }
  