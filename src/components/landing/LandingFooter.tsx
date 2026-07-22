import { SnipScissors } from '../ui/SnipScissors'

export function LandingFooter() {
  return (
    <footer className="relative z-[1] border-t px-4 md:px-8 py-12" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
      <div className="max-w-6xl mx-auto wide-zoom">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2">
            <div className="logo-snip flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.22)' }}>
                <SnipScissors size={15} speed={0.5} hoverOnly />
              </div>
              <div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '18px', fontWeight: 700, color: '#D4AF37', lineHeight: 1 }}>LEGACY</div>
                <div style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(161,161,170,0.85)', letterSpacing: '0.3em', marginTop: '2px' }}>BARBER</div>
              </div>
            </div>
            <p style={{ color: 'rgba(113,113,122,0.64)', fontSize: '13px', lineHeight: 1.7, maxWidth: '280px' }}>
              O sistema de gestão para barbearias de elite. Tecnologia que eleva o padrão do seu negócio.
            </p>
          </div>

          {[
            { title: 'Produto', links: ['Recursos', 'Preços', 'Changelog', 'Status']  },
            { title: 'Empresa', links: ['Sobre', 'Blog', 'Contato', 'Parceiros'] },
          ].map((col, i) => (
            <div key={i}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(113,113,122,0.64)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '14px' }}>
                {col.title}
              </div>
              <div className="space-y-2.5">
                {col.links.map(link => (
                  <div key={link}
                    style={{ fontSize: '13px', color: 'rgba(113,113,122,0.64)', cursor: 'pointer', transition: 'color 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.color = '#D4AF37' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.color = 'rgba(113,113,122,0.64)' }}>
                    {link}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-6 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <span style={{ fontSize: '12px', color: 'rgba(113,113,122,0.46)' }}>© 2025 Legacy Barber. Todos os direitos reservados.</span>
          <span style={{ fontSize: '12px', color: 'rgba(113,113,122,0.46)' }}>Feito com precisão artesanal.</span>
        </div>
      </div>
    </footer>
  )
}
