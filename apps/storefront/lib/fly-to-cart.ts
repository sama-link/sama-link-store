/** Glow + sparkle burst on the cart control after the flying dot lands. */
function celebrateCartArrival(target: HTMLElement) {
  const r = target.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;

  const halo = document.createElement("div");
  halo.setAttribute("aria-hidden", "true");
  Object.assign(halo.style, {
    position: "fixed",
    left: `${cx}px`,
    top: `${cy}px`,
    width: "72px",
    height: "72px",
    marginLeft: "-36px",
    marginTop: "-36px",
    borderRadius: "50%",
    pointerEvents: "none",
    zIndex: "10000",
    background:
      "radial-gradient(circle, rgba(52,211,153,0.6) 0%, rgba(16,185,129,0.22) 42%, transparent 68%)",
  });
  document.body.appendChild(halo);

  halo
    .animate(
      [
        { opacity: 0.95, transform: "scale(0.45)" },
        { opacity: 0.88, transform: "scale(1)", offset: 0.22 },
        { opacity: 0, transform: "scale(1.75)" },
      ],
      { duration: 1000, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" },
    )
    .finished.then(() => halo.remove());

  const burst = document.createElement("div");
  burst.setAttribute("aria-hidden", "true");
  Object.assign(burst.style, {
    position: "fixed",
    left: `${cx}px`,
    top: `${cy}px`,
    width: "0",
    height: "0",
    pointerEvents: "none",
    zIndex: "10001",
  });
  document.body.appendChild(burst);

  const n = 12;
  for (let i = 0; i < n; i++) {
    const arm = document.createElement("div");
    arm.style.cssText = `position:absolute;left:0;top:0;width:0;height:0;transform:rotate(${(360 / n) * i}deg);`;
    const ray = document.createElement("div");
    ray.style.cssText =
      "width:2px;height:12px;margin-left:-1px;background:linear-gradient(180deg,#fff,rgba(52,211,153,0.25));border-radius:2px;box-shadow:0 0 10px rgba(52,211,153,0.95);transform-origin:50% 100%;";
    arm.appendChild(ray);
    burst.appendChild(arm);
    ray.animate(
      [
        { transform: "translateY(-3px) scaleY(0.2)", opacity: 0 },
        { transform: "translateY(-11px) scaleY(1)", opacity: 1, offset: 0.35 },
        { transform: "translateY(-28px) scaleY(0.45)", opacity: 0 },
      ],
      { duration: 900, easing: "cubic-bezier(0.34, 1.15, 0.64, 1)", fill: "forwards" },
    );
  }
  setTimeout(() => burst.remove(), 1000);

  target.animate(
    [
      {
        filter: "brightness(1)",
      },
      {
        filter: "brightness(1.42) drop-shadow(0 0 16px rgba(52,211,153,1))",
      },
      {
        filter: "brightness(1.08) drop-shadow(0 0 8px rgba(52,211,153,0.5))",
        offset: 0.52,
      },
      {
        filter: "brightness(1)",
      },
    ],
    { duration: 1200, easing: "cubic-bezier(0.33, 1, 0.68, 1)" },
  );
}

export function flyToCart(e: React.MouseEvent<HTMLElement> | DOMRect) {
  let startX, startY;
  if ('currentTarget' in e) {
    const rect = e.currentTarget.getBoundingClientRect();
    startX = rect.left + rect.width / 2;
    startY = rect.top + rect.height / 2;
  } else {
    startX = e.left + e.width / 2;
    startY = e.top + e.height / 2;
  }

  let target = document.getElementById("mobile-cart-fab");
  
  // Elements with display: none will have a width/height of 0
  if (!target || target.getBoundingClientRect().width === 0) {
    target = document.getElementById("desktop-cart-icon");
  }
  
  if (!target) return;

  const targetRect = target.getBoundingClientRect();
  const endX = targetRect.left + targetRect.width / 2;
  const endY = targetRect.top + targetRect.height / 2;

  // Create wrapper for X movement
  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.zIndex = "9999";
  wrapper.style.left = `${startX}px`;
  wrapper.style.top = `${startY}px`;
  wrapper.style.pointerEvents = "none";
  // X easing: linear for horizontal travel
  wrapper.style.transition = "transform 1s linear";
  
  // Create inner for Y movement
  const inner = document.createElement("div");
  inner.style.width = "24px";
  inner.style.height = "24px";
  inner.style.transform = "translate(-50%, -50%)";
  inner.style.borderRadius = "50%";
  inner.style.backgroundColor = "var(--success, #10b981)";
  inner.style.boxShadow = "0 4px 12px rgba(16,185,129,0.5)";
  // Y easing: cubic-bezier for parabolic arc
  inner.style.transition = "transform 1s cubic-bezier(0.55, -0.5, 0.8, 1), opacity 1s ease-in";

  // Check icon inside the flying element
  inner.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full p-1.5"><polyline points="20 6 9 17 4 12" /></svg>`;

  wrapper.appendChild(inner);
  document.body.appendChild(wrapper);

  // Trigger reflow
  wrapper.getBoundingClientRect();

  // Animate wrapper X and inner Y
  wrapper.style.transform = `translateX(${endX - startX}px)`;
  inner.style.transform = `translate(-50%, calc(-50% + ${endY - startY}px)) scale(0.3)`;
  inner.style.opacity = "0.7";

  setTimeout(() => {
    wrapper.remove();
    if (target) celebrateCartArrival(target);
  }, 1000);
}
