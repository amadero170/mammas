import Image from "next/image";
import Link from "next/link";

export default function NosotrasPage() {
  return (
    <main className="-mt-16">
      {/* ═══════════════════════ HERO ═══════════════════════ */}
      <section className="relative flex min-h-screen items-center overflow-hidden bg-[#2e1b40]">
        {/* Background image */}
        <Image
          src="https://res.cloudinary.com/amadero170/image/upload/f_auto,q_auto/v1778972173/mammas-assets/mammas_contacto_image.jpg"
          alt="Mamás de la comunidad reunidas"
          fill
          priority
          quality={60}
          className="object-cover"
          sizes="(max-width: 1400px) 100vw, 1400px"
        />

        {/* Content — left-aligned */}
        <div className="relative z-10 w-full px-8 md:px-16 lg:px-24">
          <h1 className="font-aller text-4xl leading-[1.05] tracking-wide text-white sm:text-5xl md:text-6xl">
            somos más que
            <br />
            un directorio ·
            <br />
            somos ma+más
          </h1>

          <p className="mt-6 max-w-sm text-base font-medium text-white/80 sm:text-lg">
            Mamas Gone Wild es una comunidad de mamás en la bahía construida a
            partir de experiencias reales y apoyo mutuo.
          </p>
        </div>
      </section>

      {/* ═══════════════════════ HISTORIA Y VALORES ═══════════════════════ */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-8 md:px-16 lg:px-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24">
            
            {/* Left Column - Nuestra Historia */}
            <div>
              <h3 className="text-sm font-bold text-[#4c2f92] uppercase tracking-wider mb-6">
                Nuestra historia
              </h3>
              <h2 className="font-karla text-3xl md:text-4xl lg:text-[40px] text-[#2e1b40] leading-tight mb-8">
                De conversaciones entre amigas a una red que no para de crecer.
              </h2>
              <div className="space-y-6 text-[#2e1b40]/80 text-base leading-relaxed">
                <p>
                  Todo empezó como un grupo de amigas que compartían
                  recomendaciones, contactos, ideas y apoyo en el día a día de
                  la maternidad.
                </p>
                <p>
                  Con el tiempo, ese intercambio creció y se convirtió en algo
                  más grande: una comunidad activa, cercana y bien informada,
                  donde siempre hay alguien que puede aportar desde su
                  experiencia.
                </p>
                <p>
                  Hoy, Mamas Gone Wild es un directorio y una red de apoyo
                  donde las recomendaciones vienen de mamás reales, no de
                  publicidad. Un espacio confiable para tomar mejores
                  decisiones y sentirnos acompañadas en el camino de maternar.
                </p>
                <p className="font-bold text-[#2e1b40] pt-2">
                  Sabiduría colectiva local.
                </p>
              </div>
            </div>

            {/* Right Column - Lo que nos mueve */}
            <div className="flex flex-col items-center pt-2">
              <h3 className="text-sm font-bold text-[#4c2f92] uppercase tracking-wider mb-10 text-center">
                Lo que nos mueve
              </h3>
              
              <div className="space-y-12 flex flex-col items-center">
                
                {/* Item 1 */}
                <div className="flex flex-col items-center text-center max-w-[280px]">
                  <Image
                    src="/iconos/Contacto_onexion_icono-11.png"
                    alt="Conexiones reales"
                    width={80}
                    height={80}
                    className="mb-4 object-contain"
                  />
                  <p className="text-sm text-[#2e1b40]/80 leading-relaxed">
                    <strong className="text-[#2e1b40] font-bold">Crear conexiones reales.</strong>{" "}
                    Entre mamás que viven y comparten la vida en la bahía.
                  </p>
                </div>

                {/* Item 2 */}
                <div className="flex flex-col items-center text-center max-w-[280px]">
                  <Image
                    src="/iconos/Contacto_compartir_icono-12.png"
                    alt="Compartir lo que funciona"
                    width={80}
                    height={80}
                    className="mb-4 object-contain"
                  />
                  <p className="text-sm text-[#2e1b40]/80 leading-relaxed">
                    <strong className="text-[#2e1b40] font-bold">Compartir lo que funciona.</strong>{" "}
                    Información útil, confiable y probada en la vida real.
                  </p>
                </div>

                {/* Item 3 */}
                <div className="flex flex-col items-center text-center max-w-[280px]">
                  <Image
                    src="/iconos/Contacto_apoyo.local_icono-13.png"
                    alt="Apoyar lo local"
                    width={80}
                    height={80}
                    className="mb-4 object-contain"
                  />
                  <p className="text-sm text-[#2e1b40]/80 leading-relaxed">
                    <strong className="text-[#2e1b40] font-bold">Apoyar lo local.</strong>{" "}
                    Negocios y proyectos que hacen nuestra comunidad más fuerte.
                  </p>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════ CONTACT / ABOUT SECTION ═══════════════════════ */}
      <section className="bg-[#f0f5f1] py-20 lg:py-32">
        <div className="container mx-auto px-8 md:px-16 lg:px-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
            
            {/* Left Column - Hablemos Text */}
            <div className="flex flex-col justify-center">
              <h3 className="text-sm font-bold text-[#4c2f92] uppercase tracking-wider mb-6">
                Hablemos
              </h3>
              <h2 className="font-karla text-3xl md:text-4xl lg:text-[40px] text-[#2e1b40] leading-tight mb-8">
                Este es un espacio abierto para ti
              </h2>
              <div className="space-y-6 text-[#2e1b40] text-base leading-relaxed font-medium">
                <p>
                  Mamas Gone Wild también se construye con lo que llega de la comunidad.
                </p>
                <p>
                  Si tienes algo que compartir —un proyecto o emprendimiento, una sugerencia para la comunidad, una colaboración o cualquier otra cosa que nos quieras compartir— puedes dejarlo aquí.
                </p>
                <p>
                  Revisamos los mensajes de forma periódica.
                </p>
              </div>
            </div>

            {/* Right Column - Form */}
            <div className="flex flex-col justify-center">
              <form className="w-full space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input 
                    type="text" 
                    placeholder="Nombre" 
                    className="w-full bg-transparent border border-[#2e1b40]/40 rounded-full px-6 py-3 text-[#2e1b40] placeholder-[#2e1b40]/60 focus:outline-none focus:border-[#4c2f92] focus:ring-1 focus:ring-[#4c2f92] transition-colors" 
                  />
                  <input 
                    type="email" 
                    placeholder="Email" 
                    className="w-full bg-transparent border border-[#2e1b40]/40 rounded-full px-6 py-3 text-[#2e1b40] placeholder-[#2e1b40]/60 focus:outline-none focus:border-[#4c2f92] focus:ring-1 focus:ring-[#4c2f92] transition-colors" 
                  />
                </div>
                
                <div className="relative">
                  <select 
                    defaultValue=""
                    className="w-full bg-transparent border border-[#2e1b40]/40 rounded-full px-6 py-3 text-[#2e1b40]/70 focus:outline-none focus:border-[#4c2f92] focus:ring-1 focus:ring-[#4c2f92] transition-colors appearance-none"
                  >
                    <option value="" disabled>¿Qué te gustaría compartir?</option>
                    <option value="proyecto">Un proyecto o emprendimiento</option>
                    <option value="sugerencia">Una sugerencia para la comunidad</option>
                    <option value="colaboracion">Una colaboración</option>
                    <option value="otro">Otra cosa</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-6 text-[#2e1b40]/50">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
                
                <textarea 
                  rows={6} 
                  placeholder="Cuéntanos más..." 
                  className="w-full bg-transparent border border-[#2e1b40]/40 rounded-[32px] px-6 py-4 text-[#2e1b40] placeholder-[#2e1b40]/60 focus:outline-none focus:border-[#4c2f92] focus:ring-1 focus:ring-[#4c2f92] transition-colors resize-none"
                ></textarea>
                
                <div className="flex justify-end pt-2">
                  <button 
                    type="button" 
                    className="rounded-full bg-[#4c2f92] px-10 py-3 text-sm font-bold text-[#e5f34a] shadow transition-all hover:bg-[#3d2575] hover:shadow-lg"
                  >
                    Enviar
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════ JUNTAS SOMOS MAS FUERTES ═══════════════════════ */}
      <section className="bg-white py-16 md:py-20">
        <div className="container mx-auto px-8 md:px-16 lg:px-24">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-16">
            <h2 className="font-karla text-3xl md:text-4xl lg:text-[40px] text-[#2e1b40] w-full md:w-5/12 leading-tight text-center md:text-left">
              Juntas somos<br />más fuertes
            </h2>
            <p className="text-lg md:text-xl text-[#2e1b40]/80 w-full md:w-7/12 leading-relaxed text-center md:text-left">
              Este es un espacio donde la experiencia de otras mamás se convierte en apoyo real.
            </p>
          </div>
        </div>
      </section>


    </main>
  );
}
