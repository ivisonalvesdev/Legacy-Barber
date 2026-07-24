import frameDesktop from '../../assets/legacy-barber-frame-01.webp'
import frameMobile  from '../../assets/legacy-barber-frame-9x16.webp'

/**
 * Fundo fixo da marca — favo de mel dourado exportado do Figma. Fica preso à
 * viewport (position: fixed) e a página inteira rola por cima dele. É um frame
 * estático: leve, nítido em qualquer tela e com o centro escuro que dá
 * contraste ao texto branco/dourado. Desktop usa o 16:9; o celular troca pelo
 * 9:16 (a versão vertical, com os hexágonos concentrados na lateral).
 *
 * Substitui o antigo gradiente radial (AmbientBackground), que causava banding.
 */
export function SiteBackground() {
  return (
    <div aria-hidden className="fixed inset-0 pointer-events-none" style={{ zIndex: 0, background: '#050505' }}>
      {/* Desktop / tablet (≥ 640px) */}
      <div className="hidden sm:block absolute inset-0"
        style={{ backgroundImage: `url(${frameDesktop})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      {/* Mobile (< 640px) */}
      <div className="sm:hidden absolute inset-0"
        style={{ backgroundImage: `url(${frameMobile})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      {/* Véu sutil no topo e na base — mantém a leitura confortável sobre os
          cantos iluminados sem apagar o brilho do favo. */}
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(5,5,5,0.45) 0%, rgba(5,5,5,0.12) 22%, rgba(5,5,5,0.12) 74%, rgba(5,5,5,0.5) 100%)' }} />
    </div>
  )
}
