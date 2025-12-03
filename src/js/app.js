const store = {
  read(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch {
      return fallback;
    }
  },
  write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
};

const money = (v) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fishes = [
  {
    id: "tambaqui",
    name: "Tambaqui",
    price: 49.9,
    img: "images/tambaqui.jpeg",
  },
  {
    id: "tilapia",
    name: "Tilápia",
    price: 29.9,
    img: "images/tilapia-preparo-848x477.jpg",
  },
  {
    id: "pescada-amarela",
    name: "Pescada Amarela",
    price: 39.9,
    img: "https://peixariasaojose.wordpress.com/wp-content/uploads/2016/06/pescado.jpg?w=640",
  },
  {
    id: "tucunare",
    name: "Tucunaré",
    price: 19.5,
    img: "https://2.bp.blogspot.com/-edMdnvlVSSM/T1VuSWtrkRI/AAAAAAAACVo/FC63hnAT-ck/s1600/tucunare_assado.jpg",
  },
  {
    id: "corvina",
    name: "Corvina",
    price: 39.9,
    img: "https://feed.continente.pt/media/fkegi5ss/alimentos-corvina.jpg",
  },
];

const state = {
  user: store.read("pd_user", null),
  cart: store.read("pd_cart", []),
  order: store.read("pd_order", null),
  highlight: fishes[Math.floor(Math.random() * fishes.length)].id,
  route: "home",
};

function setRoute(route) {
  state.route = route || "home";
  render();
}

function navCount() {
  const count = state.cart.reduce((a, b) => a + b.qty, 0);
  const el = document.getElementById("cart-count");
  if (el) el.textContent = String(count);
  const userLink = document.getElementById("user-link");
  if (userLink)
    userLink.textContent = state.user
      ? state.user.name.split(" ")[0]
      : "Entrar";
}

function addToCart(id) {
  const fish = fishes.find((f) => f.id === id);
  if (!fish) return;
  const existing = state.cart.find((i) => i.id === id);
  if (existing) existing.qty += 1;
  else
    state.cart.push({
      id,
      name: fish.name,
      price: fish.price,
      img: fish.img,
      qty: 1,
    });
  store.write("pd_cart", state.cart);
  navCount();
}

function removeFromCart(id) {
  state.cart = state.cart.filter((i) => i.id !== id);
  store.write("pd_cart", state.cart);
  navCount();
  render();
}

function changeQty(id, delta) {
  const item = state.cart.find((i) => i.id === id);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  store.write("pd_cart", state.cart);
  navCount();
  render();
}

function cartTotal() {
  return state.cart.reduce((sum, i) => sum + i.price * i.qty, 0);
}

function ensureUser() {
  if (!state.user) location.hash = "#login";
  else location.hash = "#checkout";
}

function confirmOrder(payment) {
  if (!state.user || state.cart.length === 0) return;
  const order = {
    id: "PD" + Date.now(),
    status: "recebido",
    payment,
    items: state.cart,
    total: cartTotal(),
    address: state.user.address,
  };
  state.order = order;
  store.write("pd_order", order);
  state.cart = [];
  store.write("pd_cart", state.cart);
  navCount();
  location.hash = "#order";
}

function advanceStatus() {
  if (!state.order) return;
  const steps = ["recebido", "preparando", "saiu pra entrega", "entregue"];
  const i = steps.indexOf(state.order.status);
  if (i < steps.length - 1) {
    state.order.status = steps[i + 1];
    store.write("pd_order", state.order);
    render();
  }
}

function viewHome() {
  const fish = fishes.find((f) => f.id === state.highlight) || fishes[0];
  const user = state.user;
  return `
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">Frescor do mar na sua casa</h1>
        <p class="hero-sub">Peixes selecionados, entrega rápida e qualidade premium.</p>
        <div class="actions">
          <a href="#menu" class="btn btn-primary">Ver cardápio</a>
          <a href="#order" class="btn btn-ghost">Acompanhar pedido</a>
          ${
            user
              ? `<button class="btn btn-danger" onclick="(function(){ state.user = null; store.write('pd_user', null); navCount(); location.hash = '#home'; })(); return false;">Sair</button>`
              : ""
          }
        </div>
        <div class="section-title">Peixe do dia</div>
        <div class="card">
          <div class="card-media"><img src="${fish.img}" alt="${
    fish.name
  }"></div>
          <div class="card-body">
            <div class="card-title"><span>${
              fish.name
            }</span><span class="price">${money(fish.price)}</span></div>
            <div class="actions"><button class="btn btn-accent" data-add="${
              fish.id
            }">Adicionar ao carrinho</button></div>
          </div>
        </div>
        <div class="section-title">Acesso rápido</div>
        <div class="quick-links">
          <a class="quick-card" href="#menu">Cardápio</a>
          <a class="quick-card" href="#cart">Carrinho</a>
          <a class="quick-card" href="#login">${
            user ? "Minha conta" : "Cadastro/Login"
          }</a>
          <a class="quick-card" href="#checkout">Finalização</a>
          <a class="quick-card" href="#order">Acompanhar</a>
          <a class="quick-card" href="#support">Contato</a>
          ${
            user
              ? `<a class="quick-card" href="#" onclick="(function(){ state.user = null; store.write('pd_user', null); navCount(); location.hash = '#home'; })(); return false;">Sair</a>`
              : ""
          }
        </div>
      </div>
      <div class="hero-image"><img src="${fish.img}" alt="Peixe do dia"></div>
    </section>
  `;
}

function viewMenu() {
  const cards = fishes
    .map(
      (f) => `
    <article class="card">
      <div class="card-media"><img src="${f.img}" alt="${f.name}"></div>
      <div class="card-body">
        <div class="card-title"><span>${
          f.name
        }</span><span class="price">${money(f.price)}</span></div>
        <div class="actions"><button class="btn btn-primary" data-add="${
          f.id
        }">Adicionar ao carrinho</button></div>
      </div>
    </article>
  `
    )
    .join("");
  return `
    <h2 class="section-title">Cardápio</h2>
    <div class="grid">${cards}</div>
  `;
}

function viewCart() {
  if (!state.cart.length)
    return `
    <h2 class="section-title">Carrinho</h2>
    <div class="card-body">Seu carrinho está vazio. <a class="btn btn-primary" href="#menu">Ver cardápio</a></div>
  `;
  const items = state.cart
    .map(
      (i) => `
    <div class="cart-item">
      <div class="cart-thumb"><img src="${i.img}" alt="${i.name}"></div>
      <div>
        <div style="font-weight:700">${i.name}</div>
        <div style="color:var(--muted)">${money(i.price)}</div>
      </div>
      <div style="display:grid; gap:0.35rem; justify-items:end">
        <div class="qty">
          <button data-dec="${i.id}">−</button>
          <span>${i.qty}</span>
          <button data-inc="${i.id}">+</button>
        </div>
        <button class="btn btn-danger" data-remove="${i.id}">Remover</button>
      </div>
    </div>
  `
    )
    .join("");
  return `
    <h2 class="section-title">Carrinho</h2>
    <div class="cart-list">${items}</div>
    <div class="total"><span>Total</span><span>${money(
      cartTotal()
    )}</span></div>
    <div class="actions"><button class="btn btn-accent" id="checkout">Finalizar pedido</button></div>
  `;
}

function viewLogin() {
  const u = state.user || { name: "", phone: "", address: "", password: "" };
  return `
    <h2 class="section-title">Cadastro / Login</h2>
    <form class="form" id="auth-form">
      <div class="field"><label>Nome</label><input required name="name" value="${
        u.name
      }"></div>
      <div class="field"><label>Telefone</label><input required name="phone" inputmode="tel" value="${
        u.phone
      }"></div>
      <div class="field"><label>Endereço</label><input required name="address" value="${
        u.address
      }"></div>
      <div class="field"><label>Senha</label><input type="password" required name="password" value="${
        u.password || ""
      }"></div>
      <div class="actions"><button class="btn btn-primary" type="submit">Salvar e continuar</button></div>
    </form>
  `;
}

function viewCheckout() {
  if (!state.user)
    return `<div class="card-body">Faça login para continuar. <a class="btn btn-primary" href="#login">Cadastro / Login</a></div>`;
  return `
    <h2 class="section-title">Finalização do pedido</h2>
    <div class="form">
      <div class="field"><label>Endereço</label><input id="address" value="${
        state.user.address
      }"></div>
      <div class="field"><label>Pagamento</label>
        <div class="radio">
          <label><input type="radio" name="payment" value="Pix" checked> Pix</label>
          <label><input type="radio" name="payment" value="Cartão"> Cartão</label>
          <label><input type="radio" name="payment" value="Dinheiro"> Dinheiro</label>
        </div>
      </div>
      <div class="total"><span>Total</span><span>${money(
        cartTotal()
      )}</span></div>
      <div class="actions"><button class="btn btn-accent" id="confirm">Confirmar pedido</button></div>
    </div>
  `;
}

function viewOrder() {
  if (!state.order)
    return `<div class="card-body">Nenhum pedido ativo. <a class="btn btn-primary" href="#menu">Fazer pedido</a></div>`;
  const steps = ["recebido", "preparando", "saiu pra entrega", "entregue"];
  const ui = steps
    .map(
      (s) =>
        `<div class="step ${
          state.order.status === s ? "active" : ""
        }">${s}</div>`
    )
    .join("");
  return `
    <h2 class="section-title">Acompanhar pedido ${state.order.id}</h2>
    <div class="status-steps">${ui}</div>
    <div class="actions"><button class="btn btn-primary" id="advance" ${
      state.order.status === "entregue" ? "disabled" : ""
    }>Avançar status</button></div>
  `;
}

function viewSupport() {
  return `
    <h2 class="section-title">Contato e suporte</h2>
    <div class="form">
      <div>Horário de funcionamento: Seg–Sáb 10h–22h • Domingo 12h–20h</div>
      <div class="field"><label>Nome</label><input id="c-name"></div>
      <div class="field"><label>Telefone</label><input id="c-phone" inputmode="tel"></div>
      <div class="field"><label>Mensagem</label><textarea id="c-message"></textarea></div>
      <div class="actions"><button class="btn btn-primary" id="c-send">Enviar</button></div>
    </div>
  `;
}

function render() {
  const m = document.getElementById("app");
  const route = state.route;
  let html = "";
  if (route === "home") html = viewHome();
  else if (route === "menu") html = viewMenu();
  else if (route === "cart") html = viewCart();
  else if (route === "login") html = viewLogin();
  else if (route === "checkout") html = viewCheckout();
  else if (route === "order") html = viewOrder();
  else if (route === "support") html = viewSupport();
  else html = viewHome();
  m.innerHTML = html;
  bind();
  navCount();
}

function bind() {
  const appEl = document.getElementById("app");
  appEl
    .querySelectorAll("[data-add]")
    .forEach((b) =>
      b.addEventListener("click", (e) =>
        addToCart(e.target.getAttribute("data-add"))
      )
    );
  const checkoutBtn = document.getElementById("checkout");
  if (checkoutBtn) checkoutBtn.addEventListener("click", ensureUser);
  appEl
    .querySelectorAll("[data-inc]")
    .forEach((b) =>
      b.addEventListener("click", (e) =>
        changeQty(e.target.getAttribute("data-inc"), 1)
      )
    );
  appEl
    .querySelectorAll("[data-dec]")
    .forEach((b) =>
      b.addEventListener("click", (e) =>
        changeQty(e.target.getAttribute("data-dec"), -1)
      )
    );
  appEl
    .querySelectorAll("[data-remove]")
    .forEach((b) =>
      b.addEventListener("click", (e) =>
        removeFromCart(e.target.getAttribute("data-remove"))
      )
    );
  const auth = document.getElementById("auth-form");
  if (auth)
    auth.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(auth);
      const name = fd.get("name").trim();
      const phone = fd.get("phone").trim();
      const address = fd.get("address").trim();
      const password = fd.get("password");
      if (!name || !phone || !address) return;
      state.user = { name, phone, address, password };
      store.write("pd_user", state.user);
      location.hash = "#checkout";
    });
  const confirmBtn = document.getElementById("confirm");
  if (confirmBtn)
    confirmBtn.addEventListener("click", () => {
      const addr = document.getElementById("address").value.trim();
      if (addr) {
        state.user.address = addr;
        store.write("pd_user", state.user);
      }
      const payment = document.querySelector(
        'input[name="payment"]:checked'
      ).value;
      confirmOrder(payment);
    });
  const adv = document.getElementById("advance");
  if (adv) adv.addEventListener("click", advanceStatus);
  const send = document.getElementById("c-send");
  if (send)
    send.addEventListener("click", () => {
      const n = document.getElementById("c-name").value.trim();
      const p = document.getElementById("c-phone").value.trim();
      const msg = document.getElementById("c-message").value.trim();
      if (!n || !p || !msg) return alert("Preencha todos os campos");
      alert("Mensagem registrada. Obrigado pelo contato!");
      document.getElementById("c-name").value = "";
      document.getElementById("c-phone").value = "";
      document.getElementById("c-message").value = "";
    });
}

function handleHash() {
  const h = location.hash.replace("#", "") || "home";
  setRoute(h);
}

function setupDrawer() {
  const toggle = document.querySelector(".nav-toggle");
  let drawer = document.querySelector(".drawer");
  if (!drawer) {
    drawer = document.createElement("div");
    drawer.className = "drawer";
    drawer.innerHTML = `<div class="drawer-panel">
      <a href="#home">Início</a>
      <a href="#menu">Cardápio</a>
      <a href="#cart">Carrinho <span class="badge" id="drawer-count">0</span></a>
      <a href="#checkout">Finalização</a>
      <a href="#order">Acompanhar</a>
      <a href="#support">Contato</a>
      <a href="#login" id="drawer-user">Entrar</a>
    </div>`;
    document.body.appendChild(drawer);
    drawer.addEventListener("click", (e) => {
      if (e.target === drawer) drawer.classList.remove("open");
    });
  }
  if (toggle)
    toggle.addEventListener("click", () => {
      const count = state.cart.reduce((a, b) => a + b.qty, 0);
      const c = document.getElementById("drawer-count");
      if (c) c.textContent = String(count);
      const du = document.getElementById("drawer-user");
      if (du)
        du.textContent = state.user ? state.user.name.split(" ")[0] : "Entrar";
      drawer.classList.add("open");
    });
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("year").textContent = String(
    new Date().getFullYear()
  );
  setupDrawer();
  window.addEventListener("hashchange", handleHash);
  handleHash();
});
