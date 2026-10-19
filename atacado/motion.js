/* Animações da página de atacado.
   Desligar: apague a tag deste arquivo (e a de Lenis/GSAP) no index.html.
   Não altera textos, cores nem a estrutura das seções.
   O h1 não é quebrado em letras: o idioma troca o HTML interno e um split
   mudaria a quebra de linha. */
(function () {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || !window.gsap || !window.ScrollTrigger || !window.Lenis) return;

  const gsap = window.gsap;
  gsap.registerPlugin(window.ScrollTrigger);

  const lenis = new window.Lenis({
    duration: 1.05,
    smoothWheel: true,
    anchors: { offset: -172 },
  });
  window.ATACADO_SCROLL = lenis;

  lenis.on("scroll", window.ScrollTrigger.update);
  gsap.ticker.add(function (time) {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  const header = document.querySelector("[data-header]");
  lenis.on("scroll", function (event) {
    if (header) header.classList.toggle("is-scrolled", event.scroll > 8);
  });

  const hero = document.querySelector(".hero-copy");
  if (hero) {
    const kicker = hero.querySelector(".kicker");
    const title = hero.querySelector("h1");
    const lede = hero.querySelector(".lede");
    const actions = hero.querySelector(".hero-actions");
    const intro = gsap.timeline({ defaults: { ease: "power2.out" } });
    if (kicker) intro.from(kicker, { y: 16, opacity: 0, duration: 0.55, clearProps: "opacity,transform" }, 0);
    if (title) intro.from(title, { y: 26, opacity: 0, duration: 0.85, clearProps: "opacity,transform" }, 0.08);
    if (lede) intro.from(lede, { y: 16, opacity: 0, duration: 0.65, clearProps: "opacity,transform" }, 0.2);
    if (actions) intro.from(actions, { y: 14, opacity: 0, duration: 0.55, clearProps: "opacity,transform" }, 0.32);
  }

  const trustCards = gsap.utils.toArray(".trust-grid article");
  if (trustCards.length) {
    gsap.from(trustCards, {
      y: 22,
      opacity: 0,
      duration: 0.7,
      stagger: 0.08,
      ease: "power2.out",
      clearProps: "opacity,transform",
      scrollTrigger: { trigger: ".trust", start: "top 85%", once: true },
      onComplete: function () {
        trustCards.forEach(function (card) { card.classList.add("motion-settle"); });
      },
    });
  }

  const steps = gsap.utils.toArray(".steps li");
  if (steps.length) {
    gsap.from(steps, {
      y: 22,
      opacity: 0,
      duration: 0.7,
      stagger: 0.12,
      ease: "power2.out",
      clearProps: "opacity,transform",
      scrollTrigger: { trigger: ".steps", start: "top 82%", once: true },
    });
  }

  gsap.utils.toArray("main > .section").forEach(function (section) {
    if (section.id === "como-funciona") return;
    gsap.from(section, {
      y: 20,
      opacity: 0,
      duration: 0.75,
      ease: "power2.out",
      clearProps: "opacity,transform",
      scrollTrigger: { trigger: section, start: "top 86%", once: true },
    });
  });

  const howIntro = document.querySelector("#como-funciona");
  if (howIntro) {
    const bits = [howIntro.querySelector(".kicker"), howIntro.querySelector("h2"), howIntro.querySelector(".lede")].filter(Boolean);
    gsap.from(bits, {
      y: 16,
      opacity: 0,
      duration: 0.65,
      stagger: 0.08,
      ease: "power2.out",
      clearProps: "opacity,transform",
      scrollTrigger: { trigger: howIntro, start: "top 84%", once: true },
    });
  }

  /* Respiração do CTA do hero. x/y do mouse ficam num tween separado. */
  const magnetic = document.querySelector(".hero-actions .btn-gold");
  if (magnetic) {
    gsap.to(magnetic, {
      scale: 1.02,
      duration: 1.3,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });
  }
  /* Magnetic só no CTA principal do hero, e só com mouse. */
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (magnetic && finePointer) {
    magnetic.addEventListener("mousemove", function (event) {
      const box = magnetic.getBoundingClientRect();
      const x = (event.clientX - (box.left + box.width / 2)) * 0.22;
      const y = (event.clientY - (box.top + box.height / 2)) * 0.22;
      gsap.to(magnetic, { x: x, y: y, duration: 0.35, ease: "power2.out", overwrite: "auto" });
    });
    magnetic.addEventListener("mouseleave", function () {
      gsap.to(magnetic, { x: 0, y: 0, duration: 0.5, ease: "power3.out", overwrite: "auto" });
    });
  }
})();
