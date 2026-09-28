import { useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'

const UPDATED_AT = '27 de septiembre de 2026'

// Datos que el dueño del sitio debe completar antes de publicar
function Pendiente({ children }) {
  return <mark className="rounded bg-ambar-suave px-1 font-semibold text-ambar">[{children}]</mark>
}

function P({ children }) {
  return <p className="text-[15px] leading-relaxed text-niebla sm:text-base">{children}</p>
}

function List({ items }) {
  return (
    <ul className="flex flex-col gap-2 pl-0">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-niebla sm:text-base">
          <span className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-volt" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function Strong({ children }) {
  return <strong className="font-bold text-tiza">{children}</strong>
}

const TERMINOS = {
  title: 'Términos y condiciones',
  intro: 'Estas reglas explican cómo funciona el sitio y qué esperamos de quienes lo usan. Al crear una cuenta aceptas estos términos.',
  sections: [
    {
      id: 'que-es',
      title: 'Qué es este sitio',
      body: (
        <>
          <P>
            Es un juego de pronósticos sobre la Primera División de Chile, con <Strong>saldo virtual</Strong>.
            No es una casa de apuestas: no se apuesta dinero real, no se aceptan depósitos y no se pagan premios.
          </P>
          <P>El sitio es administrado por <Pendiente>NOMBRE DEL RESPONSABLE</Pendiente>.</P>
        </>
      )
    },
    {
      id: 'saldo',
      title: 'El saldo virtual',
      body: (
        <List items={[
          <>Al registrarte recibes <Strong>$1.000 de saldo virtual</Strong>.</>,
          'El saldo no es dinero, no tiene valor comercial y no se puede comprar, vender, transferir ni canjear por dinero, bienes o servicios.',
          'Podemos ajustar, corregir o reiniciar saldos si detectamos errores, abusos o cambios en el juego.'
        ]} />
      )
    },
    {
      id: 'cuenta',
      title: 'Tu cuenta',
      body: (
        <List items={[
          <>Debes tener al menos <Pendiente>18</Pendiente> años para registrarte.</>,
          'Usa datos verdaderos y una sola cuenta por persona.',
          'Eres responsable de mantener tu contraseña en secreto. Si crees que alguien entró a tu cuenta, cámbiala o escríbenos.',
          'Podemos suspender o eliminar cuentas que incumplan estos términos.'
        ]} />
      )
    },
    {
      id: 'apuestas',
      title: 'Cómo funcionan las apuestas',
      body: (
        <List items={[
          <>Eliges un pronóstico: <Strong>1</Strong> (gana el local), <Strong>X</Strong> (empate) o <Strong>2</Strong> (gana la visita).</>,
          'Solo puedes apostar antes de que empiece el partido y con el saldo que tengas disponible.',
          'Las cuotas se muestran al apostar y son las que se usan para calcular la ganancia. El saldo y los montos son en pesos enteros: el pago se redondea hacia abajo (por ejemplo, $5 a cuota 1.85 paga $9).',
          'Una apuesta confirmada no se puede cancelar.',
          'Los resultados se toman del marcador oficial del partido. Si un partido se suspende o anula, podemos anular las apuestas y devolver el saldo apostado.'
        ]} />
      )
    },
    {
      id: 'grupos',
      title: 'Grupos',
      body: (
        <>
          <P>
            Puedes crear grupos o unirte con un código de invitación. Las demás personas del grupo ven tu
            <Strong> nombre, tu correo electrónico, tu rol, tu saldo virtual, cuántas apuestas has hecho</Strong> y tus
            apuestas recientes, para armar el ranking del grupo.
            Comparte el código solo con gente de confianza.
          </P>
          <P>No publiques en nombres ni descripciones de grupos contenido ofensivo, ilegal o datos personales de otras personas.</P>
        </>
      )
    },
    {
      id: 'uso',
      title: 'Uso aceptable',
      body: (
        <List items={[
          'No intentes acceder a cuentas ajenas ni a partes del sistema que no te corresponden.',
          'No uses programas automáticos ni aproveches errores para alterar saldos o resultados. Si encuentras un error, avísanos.',
          'No uses el sitio para actividades ilegales.'
        ]} />
      )
    },
    {
      id: 'responsable',
      title: 'Juego responsable',
      body: (
        <P>
          Aunque aquí no se juega con dinero, las apuestas reales pueden generar adicción. Si sientes que el juego te afecta
          a ti o a alguien cercano, busca ayuda profesional o conversa con tu centro de salud.
        </P>
      )
    },
    {
      id: 'garantias',
      title: 'Disponibilidad y responsabilidad',
      body: (
        <P>
          El sitio se ofrece tal como está, con fines de entretenimiento. Podemos cambiarlo, pausarlo o cerrarlo, y puede
          tener errores o caídas. Como no se juega con dinero real, no respondemos por pérdidas de saldo virtual.
        </P>
      )
    },
    {
      id: 'cambios',
      title: 'Cambios a estos términos',
      body: (
        <P>
          Si cambiamos estos términos publicaremos la nueva versión en esta página con su fecha. Si el cambio es importante,
          te avisaremos en el sitio. Seguir usándolo significa que aceptas la nueva versión.
        </P>
      )
    },
    {
      id: 'contacto-terminos',
      title: 'Ley aplicable y contacto',
      body: (
        <P>
          Estos términos se rigen por las leyes de Chile. Para cualquier consulta escríbenos a <Pendiente>CORREO DE CONTACTO</Pendiente>.
        </P>
      )
    }
  ]
}

const PRIVACIDAD = {
  title: 'Política de privacidad',
  intro: 'Aquí explicamos qué datos tuyos guardamos, para qué los usamos y qué puedes hacer con ellos, conforme a la Ley N° 19.628 sobre protección de la vida privada y sus modificaciones.',
  sections: [
    {
      id: 'responsable-datos',
      title: 'Quién es responsable de tus datos',
      body: (
        <P>
          El responsable del tratamiento es <Pendiente>NOMBRE DEL RESPONSABLE</Pendiente>. Puedes escribirnos a{' '}
          <Pendiente>CORREO DE CONTACTO</Pendiente> por cualquier tema relacionado con tus datos.
        </P>
      )
    },
    {
      id: 'datos',
      title: 'Qué datos guardamos',
      body: (
        <List items={[
          <><Strong>Datos de tu cuenta:</Strong> nombre, correo electrónico y contraseña. La contraseña se guarda cifrada con bcrypt: nadie, ni siquiera nosotros, puede leerla.</>,
          <><Strong>Actividad en el juego:</Strong> tu saldo virtual y tus apuestas (partido, pronóstico, monto, estado y fecha).</>,
          <><Strong>Grupos:</Strong> los grupos que creas o a los que te unes, tu rol y la fecha en que te uniste.</>
        ]} />
      )
    },
    {
      id: 'para-que',
      title: 'Para qué los usamos',
      body: (
        <>
          <List items={[
            'Crear tu cuenta y permitirte iniciar sesión.',
            'Registrar tus apuestas, calcular tu saldo y mostrarte tu historial.',
            'Hacer funcionar los grupos y sus rankings.',
            'Mantener la seguridad del sitio y evitar abusos.'
          ]} />
          <P>No vendemos tus datos, no los usamos para publicidad y no te enviamos correos promocionales.</P>
        </>
      )
    },
    {
      id: 'quien-ve',
      title: 'Quién puede ver tus datos',
      body: (
        <List items={[
          <><Strong>Miembros de tus grupos:</Strong> ven tu nombre, tu correo, tu rol, tu saldo virtual, cuántas apuestas has hecho y tus apuestas recientes (partido, pronóstico, monto y estado).</>,
          <><Strong>Supabase:</Strong> el proveedor que aloja nuestra base de datos. Sus servidores están en Canadá, así que tus datos se almacenan fuera de Chile. La conexión a la base de datos está cifrada.</>,
          <><Strong>Google Fonts:</Strong> cargamos las tipografías desde Google, que recibe tu dirección IP al descargarlas.</>,
          <><Strong>WhatsApp:</Strong> solo si tú usas el botón de invitar. En ese caso WhatsApp recibe el mensaje con el nombre y el código del grupo.</>,
          'Autoridades, solo cuando la ley nos obligue.'
        ]} />
      )
    },
    {
      id: 'navegador',
      title: 'Qué guardamos en tu navegador',
      body: (
        <P>
          Para mantener tu sesión abierta guardamos en el almacenamiento local de tu navegador (localStorage) un token de acceso,
          que vence a las 24 horas, y tus datos básicos (nombre, correo y saldo). Se borran al cerrar sesión.
          No usamos cookies de publicidad ni herramientas de analítica.
        </P>
      )
    },
    {
      id: 'conservacion',
      title: 'Cuánto tiempo los guardamos',
      body: (
        <P>
          Mientras tu cuenta exista. Si pides eliminarla, borraremos tus datos personales en un plazo de <Pendiente>30 días</Pendiente>,
          salvo lo que la ley nos obligue a conservar.
        </P>
      )
    },
    {
      id: 'derechos',
      title: 'Tus derechos',
      body: (
        <>
          <P>Puedes pedirnos en cualquier momento:</P>
          <List items={[
            <><Strong>Acceso:</Strong> saber qué datos tuyos tenemos.</>,
            <><Strong>Rectificación:</Strong> corregir datos incorrectos.</>,
            <><Strong>Eliminación:</Strong> borrar tu cuenta y tus datos.</>,
            <><Strong>Oposición:</Strong> que dejemos de usar tus datos para algún fin.</>,
            <><Strong>Portabilidad:</Strong> recibir una copia de tus datos en un formato común.</>
          ]} />
          <P>
            Escríbenos a <Pendiente>CORREO DE CONTACTO</Pendiente> desde el correo de tu cuenta. Te responderemos en un plazo
            máximo de <Pendiente>30 días</Pendiente>. Si no quedas conforme, puedes recurrir a la autoridad de protección de datos personales de Chile.
          </P>
        </>
      )
    },
    {
      id: 'menores',
      title: 'Menores de edad',
      body: (
        <P>
          El sitio no está dirigido a menores de <Pendiente>18</Pendiente> años. Si descubrimos que una cuenta pertenece a un menor, la eliminaremos.
        </P>
      )
    },
    {
      id: 'cambios-privacidad',
      title: 'Cambios a esta política',
      body: (
        <P>
          Si cambiamos esta política publicaremos la nueva versión en esta página con su fecha. Si el cambio es importante,
          te avisaremos en el sitio.
        </P>
      )
    }
  ]
}

const DOCS = { terminos: TERMINOS, privacidad: PRIVACIDAD }

export default function Legal({ doc }) {
  const { title, intro, sections } = DOCS[doc]

  useEffect(() => {
    const previousTitle = document.title
    document.title = `${title} · Apuestas Deportivas`
    window.scrollTo(0, 0)
    return () => { document.title = previousTitle }
  }, [title])

  const tabClass = ({ isActive }) =>
    `flex h-11 items-center rounded-xl px-4 text-sm font-extrabold no-underline transition-colors ${
      isActive ? 'bg-tiza text-noche' : 'text-niebla hover:bg-pasto hover:text-tiza'
    }`

  return (
    <div className="min-h-screen bg-noche font-body text-tiza">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-4 pb-20 pt-10 sm:px-8 lg:pt-14">
        <header className="flex flex-col gap-6">
          <nav aria-label="Documentos legales" className="flex gap-1.5 self-start rounded-2xl border border-[#1E2735] bg-[#0A0E14] p-1.5">
            <NavLink to="/terminos" className={tabClass}>Términos</NavLink>
            <NavLink to="/privacidad" className={tabClass}>Privacidad</NavLink>
          </nav>
          <div className="flex flex-col gap-3">
            <span className="text-xs font-extrabold tracking-[0.15em] text-gris">LEGAL · ACTUALIZADO EL {UPDATED_AT.toUpperCase()}</span>
            <h1 className="font-display text-5xl uppercase italic leading-[0.9] sm:text-7xl">{title}</h1>
            <p className="max-w-2xl text-base leading-relaxed text-niebla sm:text-lg">{intro}</p>
          </div>
        </header>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12">
          <aside className="rounded-3xl border border-linea bg-grada p-5 lg:sticky lg:top-24">
            <h2 className="mb-3 text-xs font-extrabold tracking-[0.15em] text-gris">EN ESTA PÁGINA</h2>
            <ol className="flex flex-col gap-0.5 pl-0">
              {sections.map((s, i) => (
                <li key={s.id} className="list-none">
                  <a href={`#${s.id}`} className="flex gap-2.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-niebla no-underline transition-colors hover:bg-pasto hover:text-tiza">
                    <span className="w-5 shrink-0 font-cifras text-xs leading-5 text-gris">{String(i + 1).padStart(2, '0')}</span>
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </aside>

          <article className="flex flex-col gap-4">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-24 flex flex-col gap-4 rounded-3xl border border-linea bg-grada p-6 sm:p-8">
                <h2 className="flex items-baseline gap-3 text-xl font-extrabold sm:text-2xl">
                  <span className="font-display text-2xl italic text-volt sm:text-3xl">{String(i + 1).padStart(2, '0')}</span>
                  {s.title}
                </h2>
                {s.body}
              </section>
            ))}

            <p className="px-2 pt-4 text-sm text-gris">
              {doc === 'terminos'
                ? <>Lee también nuestra <Link to="/privacidad" className="font-bold text-volt no-underline">Política de privacidad</Link>.</>
                : <>Lee también nuestros <Link to="/terminos" className="font-bold text-volt no-underline">Términos y condiciones</Link>.</>}
            </p>
          </article>
        </div>
      </div>
    </div>
  )
}
