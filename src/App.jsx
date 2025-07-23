import { useState, useEffect } from 'react'
import AOS from 'aos'
import 'aos/dist/aos.css'
import './App.css'

function App() {
  const [scrollY, setScrollY] = useState(0)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    // Inicializar AOS solo en dispositivos con ancho mayor a 768px
    AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      once: true,
      offset: 50,
      delay: 0,
      disable: window.innerWidth < 768, // Deshabilitar en móviles
      startEvent: 'DOMContentLoaded',
      initClassName: 'aos-init',
      animatedClassName: 'aos-animate',
      useClassNames: false,
      disableMutationObserver: false,
      debounceDelay: 50,
      throttleDelay: 99,
    })

    // Función para manejar el resize y reinicializar AOS si es necesario
    const handleResize = () => {
      AOS.refresh()
    }

    // Scroll handler
    const handleScroll = () => setScrollY(window.scrollY)
    
    window.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  return (
    <div className="app">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <h3>FORTALEZA</h3>
          </div>
          <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
            <a href="#inicio" className="nav-link" onClick={closeMenu}>Inicio</a>
            <a href="#quienes-somos" className="nav-link" onClick={closeMenu}>Quiénes Somos</a>
            <a href="#ubicacion" className="nav-link" onClick={closeMenu}>Ubicación</a>
            <a href="#servicios" className="nav-link" onClick={closeMenu}>Servicios</a>
            <a href="#contacto" className="nav-link" onClick={closeMenu}>Contacto</a>
            <button className="nav-login-btn" onClick={closeMenu}>Iniciar Sesión</button>
          </div>
          <div className={`nav-toggle ${isMenuOpen ? 'active' : ''}`} onClick={toggleMenu}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="inicio" className="hero">
        <div 
          className="hero-background"
          style={{
            transform: `translateY(${scrollY * 0.5}px)`
          }}
        ></div>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          {/* <h1 className="hero-title">
            FORTALEZA
            <span className="hero-subtitle">MULTIESPACIO</span>
          </h1> */}

<div className="nav-logo-fortaleza">
  <img src="/public/20250722_1102_Logo Fortaleza Mejorado_remix_01k0s6th6efftr2w6q7nrv4nvc-Photoroom.png"/>
</div>

          <p className="hero-description">
            Tu espacio de transformación y bienestar
          </p>
          <button className="hero-button">
            Comienza Tu Transformación
          </button>
        </div>
        <div className="scroll-indicator">
          <div className="scroll-arrow"></div>
        </div>
      </section>

      {/* About Section */}
      <section id="quienes-somos" className="section">
        <div className="container">
          <div className="section-header" data-aos="fade-up">
            <h2 className="section-title">Quiénes Somos</h2>
            <div className="section-line"></div>
          </div>
          <div className="about-content">
            <div className="about-text" data-aos="fade-right">
              <p>
                Somos un gimnasio comprometido con tu bienestar integral. 
                Ofrecemos un ambiente profesional y motivador donde podrás 
                alcanzar tus objetivos de fitness y salud.
              </p>
              <p>
                Con años de experiencia en el sector, nos especializamos en 
                brindar entrenamientos personalizados y un acompañamiento 
                profesional en cada paso de tu transformación.
              </p>
            </div>
            <div className="about-stats" data-aos="fade-left">
              <div className="stat" data-aos="zoom-in" data-aos-delay="100">
                <h3>500+</h3>
                <p>Miembros Activos</p>
              </div>
              <div className="stat" data-aos="zoom-in" data-aos-delay="200">
                <h3>5+</h3>
                <p>Años de Experiencia</p>
              </div>
              <div className="stat" data-aos="zoom-in" data-aos-delay="300">
                <h3>24/7</h3>
                <p>Horarios de Atención</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section id="ubicacion" className="section bg-dark">
        <div className="container">
          <div className="section-header" data-aos="fade-up">
            <h2 className="section-title light">Dónde Nos Encontramos</h2>
            <div className="section-line"></div>
          </div>
          <div className="location-content">
            <div className="location-info" data-aos="fade-right">
              <h3>Ubicación Central</h3>
              <p>
                Estamos estratégicamente ubicados en el corazón de la ciudad, 
                con fácil acceso en transporte público y amplio estacionamiento.
              </p>
              <div className="location-details">
                <div className="detail" data-aos="fade-up" data-aos-delay="100">
                  <strong>Dirección:</strong>
                  <p>Av. Principal 123, Centro</p>
                </div>
                <div className="detail" data-aos="fade-up" data-aos-delay="200">
                  <strong>Horarios:</strong>
                  <p>Lunes a Domingo: 6:00 AM - 11:00 PM</p>
                </div>
                <div className="detail" data-aos="fade-up" data-aos-delay="300">
                  <strong>Teléfono:</strong>
                  <p>+54 11 1234-5678</p>
                </div>
              </div>
            </div>
            <div className="location-map" data-aos="fade-left">
              <iframe
    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d704.9256799651057!2d-55.90002176572633!3d-27.365488563350787!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9457be311db67cf7%3A0x557af3e84aa4ced2!2sSan%20Mart%C3%ADn%202381%2C%20N3300%20Posadas%2C%20Misiones!5e0!3m2!1ses-419!2sar!4v1753231122447!5m2!1ses-419!2sar"
    width="100%"
    height="450"
    style={{ border: 0, borderRadius: '8px' }}
    allowFullScreen=""
    loading="lazy"
    referrerPolicy="no-referrer-when-downgrade"
  ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
            {/* Services Section */}
      <section id="servicios" className="section">
        <div className="container">
          <div className="section-header" data-aos="fade-up">
            <h2 className="section-title">Nuestros Servicios</h2>
            <div className="section-line"></div>
          </div>
          <div className="services-grid">
            <div className="service-card" data-aos="fade-up" data-aos-delay="100">
              <div className="service-icon">🏋️</div>
              <h3>Entrenamiento Personalizado</h3>
              <p>Programas diseñados específicamente para tus objetivos y necesidades.</p>
            </div>
            <div className="service-card" data-aos="fade-up" data-aos-delay="200">
              <div className="service-icon">🥊</div>
              <h3>Clases Grupales</h3>
              <p>Variedad de clases: CrossFit, Spinning, Yoga, Pilates y más.</p>
            </div>
            <div className="service-card" data-aos="fade-up" data-aos-delay="300">
              <div className="service-icon">⚡</div>
              <h3>Área Funcional</h3>
              <p>Espacio dedicado al entrenamiento funcional y ejercicios TRX.</p>
            </div>
            <div className="service-card" data-aos="fade-up" data-aos-delay="400">
              <div className="service-icon">💪</div>
              <h3>Zona de Pesas</h3>
              <p>Equipamiento completo para entrenamiento de fuerza y musculación.</p>
            </div>
            <div className="service-card" data-aos="fade-up" data-aos-delay="500">
              <div className="service-icon">�</div>
              <h3>Cardio Moderno</h3>
              <p>Máquinas de última generación para entrenamiento cardiovascular.</p>
            </div>
            <div className="service-card" data-aos="fade-up" data-aos-delay="600">
              <div className="service-icon">🧘</div>
              <h3>Sala de Relajación</h3>
              <p>Espacio para estiramientos, meditación y recuperación.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contacto" className="section bg-primary">
        <div className="container">
          <div className="section-header" data-aos="fade-up">
            <h2 className="section-title light">Contacto</h2>
            <div className="section-line"></div>
          </div>
          <div className="contact-content">
            <div className="contact-info" data-aos="fade-right">
              <h3>¿Listo para comenzar?</h3>
              <p>Contáctanos y da el primer paso hacia tu transformación</p>
              <div className="contact-methods">
                <div className="contact-method" data-aos="fade-up" data-aos-delay="100">
                  <span className="contact-icon">📞</span>
                  <span>+54 11 1234-5678</span>
                </div>
                <div className="contact-method" data-aos="fade-up" data-aos-delay="200">
                  <span className="contact-icon">📧</span>
                  <span>info@multiespaciogym.com</span>
                </div>
                <div className="contact-method" data-aos="fade-up" data-aos-delay="300">
                  <span className="contact-icon">📍</span>
                  <span>Av. Principal 123, Centro</span>
                </div>
              </div>
            </div>
            <div className="contact-form" data-aos="fade-left">
              <form>
                <input type="text" placeholder="Tu nombre" data-aos="fade-up" data-aos-delay="100" />
                <input type="email" placeholder="Tu email" data-aos="fade-up" data-aos-delay="200" />
                <textarea placeholder="Tu mensaje" rows="4" data-aos="fade-up" data-aos-delay="300"></textarea>
                <button type="submit" data-aos="fade-up" data-aos-delay="400">Enviar Mensaje</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section" data-aos="fade-up" data-aos-delay="100">
              <h3>FORTALEZA</h3>
              <p>Tu gimnasio de confianza para alcanzar tus metas de fitness y bienestar.</p>
            </div>
            <div className="footer-section" data-aos="fade-up" data-aos-delay="200">
              <h4>Enlaces Rápidos</h4>
              <ul>
                <li><a href="#inicio">Inicio</a></li>
                <li><a href="#quienes-somos">Quiénes Somos</a></li>
                <li><a href="#servicios">Servicios</a></li>
                <li><a href="#contacto">Contacto</a></li>
              </ul>
            </div>
            <div className="footer-section" data-aos="fade-up" data-aos-delay="300">
              <h4>Síguenos</h4>
              <div className="social-links">
                <a href="#" className="social-link">Facebook</a>
                <a href="#" className="social-link">Instagram</a>
                <a href="#" className="social-link">Twitter</a>
                <a href="#" className="social-link">YouTube</a>
              </div>
            </div>
            <div className="footer-section" data-aos="fade-up" data-aos-delay="400">
              <h4>Horarios</h4>
              <p>Lunes a Domingo</p>
              <p>6:00 AM - 11:00 PM</p>
            </div>
          </div>
          <div className="footer-bottom" data-aos="fade-up">
            <p>&copy; 2025 Gimnasio Multiespacio. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
