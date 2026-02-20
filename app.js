/* =======================
   LOCAL DATABASE
======================= */
let DB = JSON.parse(localStorage.getItem("POSDZ")) || {
  users:    [{ name: "Admin", pin: "1234", role: "manager", immutable: true }],
  settings: {
    // برنامج
    name: "POS DZ", phone: "", addr: "", welcome: "",
    currency: "دج", lang: "ar",
    dateFormat: "DD-MM-YYYY", timeFormat: "24",
    logo: "",
    // طباعة
    printer: "default", paperSize: "80mm", copies: 1,
    printLogo: false, printShopName: true, printPhone: true,
    printWelcome: true, printBarcode: false, printCustBarcode: false,
    invoiceNum: 1
  },
  stock:     [],
  cart:      [],
  customers: [],
  debts:     [],
  sales:     []
};

/* =======================
   DOM ELEMENTS
======================= */
const loginScreen    = document.getElementById("loginScreen");
const userSelect     = document.getElementById("userSelect");
const pinInput       = document.getElementById("pin");
const mainApp        = document.getElementById("mainApp");

const usersModal     = document.getElementById("usersModal");
const usersTableBody = document.querySelector("#usersTable tbody");
const addUserForm    = document.getElementById("addUserForm");
const newUserName    = document.getElementById("newUserName");
const newUserPin     = document.getElementById("newUserPin");
const newUserRole    = document.getElementById("newUserRole");

const alertUserName   = document.getElementById("alertUserName");
const alertUserPin    = document.getElementById("alertUserPin");
const alertUserRole   = document.getElementById("alertUserRole");
const addUserInAlerts = document.getElementById("addUserInAlerts");

const stockList    = document.getElementById("stockList");
const sideMenu     = document.getElementById("sideMenu");
const menuBtn      = document.getElementById("menuBtn");

const currentTimeEl = document.getElementById("currentTime");
const currentDateEl = document.getElementById("currentDate");

const salePage      = document.getElementById("sale");
const cartTableBody = document.getElementById("cart");
const searchInput   = document.getElementById("search");
const custSelect    = document.getElementById("custSelect");
const totalEl       = document.getElementById("total");

/* =======================
   UTILITY FUNCTIONS
======================= */
function saveDB() { localStorage.setItem("POSDZ", JSON.stringify(DB)); }

function getCurrency() { return DB.settings.currency || "دج"; }

function formatPrice(val) {
  return Number(val).toFixed(2) + " " + getCurrency();
}

function formatDate(isoStr) {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  const day   = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year  = d.getFullYear();
  const fmt   = DB.settings.dateFormat || "DD-MM-YYYY";
  return fmt.replace("DD", day).replace("MM", month).replace("YYYY", year);
}

function isSameDay(d1, d2) {
  return d1.getFullYear()===d2.getFullYear() &&
         d1.getMonth()===d2.getMonth() &&
         d1.getDate()===d2.getDate();
}

function isSameWeek(d1, d2) {
  const startOfWeek = (d) => {
    const dd = new Date(d); dd.setDate(dd.getDate() - dd.getDay()); dd.setHours(0,0,0,0); return dd;
  };
  return startOfWeek(d1).getTime() === startOfWeek(d2).getTime();
}

function isSameMonth(d1, d2) {
  return d1.getFullYear()===d2.getFullYear() && d1.getMonth()===d2.getMonth();
}

function isSameYear(d1, d2) {
  return d1.getFullYear()===d2.getFullYear();
}

/* =======================
   LOGIN SYSTEM
======================= */
function renderUserSelect() {
  userSelect.innerHTML = '<option value="">— اختر المستخدم —</option>';
  DB.users.forEach(u => {
    const opt = document.createElement("option");
    opt.value = u.name; opt.textContent = u.name;
    userSelect.appendChild(opt);
  });
}

function login() {
  const selectedName = userSelect.value;
  const pin = pinInput.value.trim();
  if (!selectedName) { alert("اختر المستخدم أولاً"); return; }
  const user = DB.users.find(u => u.name === selectedName && u.pin === pin);
  if (!user) { alert("اسم المستخدم أو الرمز خاطئ"); return; }
  localStorage.setItem("POSDZ_LOGGED", JSON.stringify(user));
  loginScreen.style.display = "none";
  mainApp.style.display = "block";
  applyHeader();
  showSale();
  startClock();
}

function logout() {
  localStorage.removeItem("POSDZ_LOGGED");
  loginScreen.style.display = "flex";
  mainApp.style.display = "none";
  sideMenu.classList.add("hidden");
}

function applyHeader() {
  document.getElementById("shopName").textContent = DB.settings.name || "POS DZ";
  const logo = DB.settings.logo;
  const headerLogo = document.getElementById("headerLogo");
  if (logo) { headerLogo.src = logo; headerLogo.style.display = "block"; }
  else { headerLogo.style.display = "none"; }
}

/* =======================
   SETTINGS — القسم الأول: البرنامج
======================= */
function loadSettings() {
  const s = DB.settings;
  // برنامج
  document.getElementById("sDateFormat").value = s.dateFormat  || "DD-MM-YYYY";
  document.getElementById("sTimeFormat").value = s.timeFormat  || "24";
  document.getElementById("sCurrency").value   = s.currency    || "دج";
  document.getElementById("sLang").value       = s.lang        || "ar";
  // متجر
  document.getElementById("sname").value    = s.name    || "";
  document.getElementById("sphone").value   = s.phone   || "";
  document.getElementById("saddr").value    = s.addr    || "";
  document.getElementById("sWelcome").value = s.welcome || "";
  if (s.logo) {
    document.getElementById("logoPreview").src = s.logo;
    document.getElementById("logoPreview").style.display = "block";
  }
  // طباعة
  document.getElementById("sInvoiceNum").value      = s.invoiceNum      || 1;
  document.getElementById("sPrinter").value         = s.printer         || "default";
  document.getElementById("sPaperSize").value       = s.paperSize       || "80mm";
  document.getElementById("sCopies").value          = s.copies          || 1;
  document.getElementById("sPrintLogo").checked     = !!s.printLogo;
  document.getElementById("sPrintShopName").checked = s.printShopName !== false;
  document.getElementById("sPrintPhone").checked    = s.printPhone   !== false;
  document.getElementById("sPrintWelcome").checked  = s.printWelcome !== false;
  document.getElementById("sPrintBarcode").checked  = !!s.printBarcode;
  document.getElementById("sPrintCustBarcode").checked = !!s.printCustBarcode;
}

function saveSettingsApp() {
  DB.settings.dateFormat  = document.getElementById("sDateFormat").value;
  DB.settings.timeFormat  = document.getElementById("sTimeFormat").value;
  DB.settings.currency    = document.getElementById("sCurrency").value.trim() || "دج";
  DB.settings.lang        = document.getElementById("sLang").value;
  saveDB();
  alert("✅ تم حفظ إعدادات البرنامج!");
}

function saveSettingsStore() {
  DB.settings.name    = document.getElementById("sname").value.trim();
  DB.settings.phone   = document.getElementById("sphone").value.trim();
  DB.settings.addr    = document.getElementById("saddr").value.trim();
  DB.settings.welcome = document.getElementById("sWelcome").value.trim();
  saveDB();
  applyHeader();
  alert("✅ تم حفظ بيانات المتجر!");
}

function saveSettingsPrint() {
  DB.settings.invoiceNum        = parseInt(document.getElementById("sInvoiceNum").value)  || 1;
  DB.settings.printer           = document.getElementById("sPrinter").value;
  DB.settings.paperSize         = document.getElementById("sPaperSize").value;
  DB.settings.copies            = parseInt(document.getElementById("sCopies").value) || 1;
  DB.settings.printLogo         = document.getElementById("sPrintLogo").checked;
  DB.settings.printShopName     = document.getElementById("sPrintShopName").checked;
  DB.settings.printPhone        = document.getElementById("sPrintPhone").checked;
  DB.settings.printWelcome      = document.getElementById("sPrintWelcome").checked;
  DB.settings.printBarcode      = document.getElementById("sPrintBarcode").checked;
  DB.settings.printCustBarcode  = document.getElementById("sPrintCustBarcode").checked;
  saveDB();
  alert("✅ تم حفظ إعدادات الطباعة!");
}

// تبويبات الإعدادات
function switchSettingsTab(panel, btn) {
  document.querySelectorAll(".settings-panel").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".stab").forEach(b => b.classList.remove("active"));
  document.getElementById("settings" + panel.charAt(0).toUpperCase() + panel.slice(1)).classList.add("active");
  btn.classList.add("active");
}

// شعار المتجر
function previewLogo(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    DB.settings.logo = e.target.result;
    document.getElementById("logoPreview").src = e.target.result;
    document.getElementById("logoPreview").style.display = "block";
    saveDB(); applyHeader();
  };
  reader.readAsDataURL(file);
}

function removeLogo() {
  DB.settings.logo = "";
  document.getElementById("logoPreview").src = "";
  document.getElementById("logoPreview").style.display = "none";
  saveDB(); applyHeader();
}

// دالة saveSettings القديمة للتوافق (تستدعي القسم الصحيح)
function saveSettings() { saveSettingsStore(); }

/* =======================
   USER MANAGEMENT
======================= */
function renderUsersTable() {
  usersTableBody.innerHTML = "";
  DB.users.forEach((user, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${user.name}</td>
      <td>${"*".repeat(user.pin.length)}</td>
      <td>${user.role === "manager" ? "مدير" : "بائع"}</td>
      <td>
        <button onclick="editUser(${index})" ${user.immutable?"disabled":""}>تعديل</button>
        <button onclick="deleteUser(${index})" ${user.immutable?"disabled":""} style="background:#ef4444">حذف</button>
      </td>
    `;
    usersTableBody.appendChild(tr);
  });
}

function addUser(e) {
  e.preventDefault();
  const name = newUserName.value.trim();
  const pin  = newUserPin.value.trim();
  const role = newUserRole.value;
  if (!name || pin.length!==4 || !/^\d+$/.test(pin)) { alert("الرجاء إدخال اسم صحيح وPIN من 4 أرقام"); return; }
  if (DB.users.find(u=>u.name===name)) { alert("اسم المستخدم موجود مسبقًا"); return; }
  DB.users.push({name,pin,role,immutable:false});
  saveDB(); renderUsersTable(); renderUserSelect(); renderAlerts();
  addUserForm.reset();
}

function editUser(index) {
  const user = DB.users[index];
  const newName = prompt("تعديل الاسم:", user.name)||user.name;
  const newPin  = prompt("تعديل PIN (4 أرقام):", user.pin)||user.pin;
  const newRole = prompt("الدور (manager / baker):", user.role)||user.role;
  if (newPin.length!==4||!/^\d+$/.test(newPin)) { alert("PIN يجب أن يكون 4 أرقام"); return; }
  user.name=newName; user.pin=newPin; user.role=newRole;
  saveDB(); renderUsersTable(); renderUserSelect(); renderAlerts();
}

function deleteUser(index) {
  if (DB.users[index].immutable) { alert("لا يمكن حذف هذا المستخدم"); return; }
  if (confirm("هل أنت متأكد من حذف هذا المستخدم؟")) {
    DB.users.splice(index,1);
    saveDB(); renderUsersTable(); renderUserSelect(); renderAlerts();
  }
}

function renderAlerts() {
  const alertList = document.getElementById("alertList");
  alertList.innerHTML = "";
  DB.users.forEach((user,index) => {
    const li = document.createElement("li");
    li.style.cssText = "display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #eee";
    li.innerHTML = `
      <span><strong>${user.name}</strong> — ${user.role==="manager"?"مدير":"بائع"}</span>
      <span>
        <button onclick="editUser(${index})" ${user.immutable?"disabled":""} style="font-size:13px;padding:5px 10px">تعديل</button>
        <button onclick="deleteUser(${index})" ${user.immutable?"disabled":""} style="background:#ef4444;font-size:13px;padding:5px 10px;margin-right:4px">حذف</button>
      </span>
    `;
    alertList.appendChild(li);
  });
}

function addUserInAlertsFunc(e) {
  e.preventDefault();
  const name = alertUserName.value.trim();
  const pin  = alertUserPin.value.trim();
  const role = alertUserRole.value;
  if (!name||pin.length!==4||!/^\d+$/.test(pin)) { alert("الرجاء إدخال اسم صحيح وPIN من 4 أرقام"); return; }
  if (DB.users.find(u=>u.name===name)) { alert("اسم المستخدم موجود مسبقًا"); return; }
  DB.users.push({name,pin,role,immutable:false});
  saveDB(); renderUsersTable(); renderUserSelect(); renderAlerts();
  addUserInAlerts.reset();
}

function closeUsersModal() { usersModal.style.display="none"; }

/* =======================
   NAVIGATION
======================= */
function hideAllPages() {
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
}

function showSale() {
  hideAllPages(); salePage.classList.add("active");
  renderCustomerSelect(); sideMenu.classList.add("hidden");
}

function show(id) {
  hideAllPages();
  const page = document.getElementById(id);
  if (page) page.classList.add("active");
  if (id==="reports")   renderReports();
  if (id==="settings")  { loadSettings(); }
  if (id==="alerts")    renderAlerts();
  if (id==="customers") renderCustomerList();
  if (id==="stock")     renderStock();
  sideMenu.classList.add("hidden");
}

function goBack() { showSale(); }

/* =======================
   CUSTOMERS
======================= */
function renderCustomerSelect() {
  custSelect.innerHTML = '<option value="">— بدون زبون —</option>';
  DB.customers.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.name; opt.textContent = c.name;
    custSelect.appendChild(opt);
  });
}

function addCustomer() {
  const name = document.getElementById("cname").value.trim();
  if (!name) { alert("أدخل اسم الزبون"); return; }
  if (DB.customers.find(c=>c.name===name)) { alert("الزبون موجود مسبقًا"); return; }
  DB.customers.push({name, debts:[]});
  document.getElementById("cname").value = "";
  saveDB(); renderCustomerList(); renderCustomerSelect();
}

function renderCustomerList() {
  const clist = document.getElementById("clist");
  clist.innerHTML = "";
  if (!DB.customers.length) {
    clist.innerHTML = "<li style='color:#6b7280;text-align:center'>لا يوجد زبائن بعد</li>";
    return;
  }
  DB.customers.forEach((c,index) => {
    const totalDebt = (c.debts||[]).reduce((s,d)=>s+(d.remaining||0), 0);
    const li = document.createElement("li");
    li.style.cssText = "display:flex;justify-content:space-between;align-items:center;padding:8px 4px;border-bottom:1px solid #eee";
    li.innerHTML = `
      <span>
        <strong>${c.name}</strong>
        ${totalDebt>0?`<span style="color:#ef4444;font-size:13px"> (دين: ${formatPrice(totalDebt)})</span>`:""}
      </span>
      <button onclick="deleteCustomer(${index})" style="background:#ef4444;padding:5px 10px;font-size:13px">حذف</button>
    `;
    clist.appendChild(li);
  });
}

function deleteCustomer(index) {
  if (confirm("هل أنت متأكد من حذف هذا الزبون؟")) {
    DB.customers.splice(index,1);
    saveDB(); renderCustomerList(); renderCustomerSelect();
  }
}

/* =======================
   STOCK MANAGEMENT
======================= */
function saveItem() {
  const type      = document.getElementById("type").value.trim();
  const brand     = document.getElementById("brand").value.trim();
  const size      = document.getElementById("size").value.trim();
  const barcode   = document.getElementById("barcode").value.trim();
  const price     = parseFloat(document.getElementById("price").value);
  const costPrice = parseFloat(document.getElementById("costPrice").value);
  const qty       = parseInt(document.getElementById("qty").value);
  const exp       = document.getElementById("exp").value;

  if (!type||!brand||!barcode||isNaN(price)||isNaN(costPrice)||isNaN(qty)) {
    alert("الرجاء إدخال كل البيانات بشكل صحيح!"); return;
  }

  const existing = DB.stock.find(i=>i.barcode===barcode);
  if (existing) { existing.qty+=qty; alert("المنتج موجود — تم تحديث الكمية!"); }
  else { DB.stock.push({type,brand,size,barcode,price,costPrice,qty,exp}); alert("تم إضافة السلعة بنجاح!"); }

  ["type","brand","size","barcode","price","costPrice","qty","exp"].forEach(id=>{
    document.getElementById(id).value="";
  });
  saveDB(); renderStock();
}

function editItem(index) {
  const item = DB.stock[index];
  const newPrice = prompt("السعر الجديد:", item.price);
  const newQty   = prompt("الكمية الجديدة:", item.qty);
  if (newPrice!==null&&!isNaN(newPrice)) item.price=parseFloat(newPrice);
  if (newQty!==null&&!isNaN(newQty))     item.qty=parseInt(newQty);
  saveDB(); renderStock();
}

function deleteItem(index) {
  if (!confirm("حذف المنتج؟")) return;
  DB.stock.splice(index,1);
  saveDB(); renderStock();
}

function renderStock() {
  stockList.innerHTML = "";
  const q = (document.getElementById("stockSearch")?.value||"").toLowerCase();
  const list = q ? DB.stock.filter(i=>i.type.toLowerCase().includes(q)||i.barcode.includes(q)) : DB.stock;

  if (!list.length) {
    stockList.innerHTML = "<li style='color:#6b7280;text-align:center'>لا توجد منتجات</li>";
    return;
  }
  list.forEach((item, idx) => {
    const realIndex = DB.stock.indexOf(item);
    const expired = item.exp && new Date(item.exp) < new Date();
    const li = document.createElement("li");
    li.style.cssText = "padding:10px 4px;border-bottom:1px solid #eee";
    li.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
        <div>
          <strong>${item.type}</strong> | ${item.brand} ${item.size?"| "+item.size:""}
          | باركود: <code>${item.barcode}</code>
          | سعر: <strong>${formatPrice(item.price)}</strong>
          | كمية: <strong style="color:${item.qty<5?"#ef4444":"#10b981"}">${item.qty}</strong>
          ${expired?"<span style='color:#ef4444;font-size:12px'> ⚠ منتهي الصلاحية</span>":""}
        </div>
        <div>
          <button onclick="editItem(${realIndex})" style="padding:5px 10px;font-size:13px">تعديل</button>
          <button onclick="deleteItem(${realIndex})" style="background:#ef4444;padding:5px 10px;font-size:13px;margin-right:4px">مسح</button>
        </div>
      </div>
    `;
    stockList.appendChild(li);
  });
}

/* =======================
   SALE & CART
======================= */
function renderSaleStock() {
  cartTableBody.innerHTML = "";
  DB.cart.forEach((cItem, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${cItem.name}</td>
      <td>
        <button onclick="decreaseQty(${index})" style="padding:3px 10px">−</button>
        <strong> ${cItem.qty} </strong>
        <button onclick="increaseQty(${index})" style="padding:3px 10px">+</button>
      </td>
      <td>${formatPrice(cItem.price)}</td>
      <td>${formatPrice(cItem.price*cItem.qty)}</td>
      <td><button onclick="removeFromCart(${index})" style="background:#ef4444;padding:5px 10px;font-size:13px">حذف</button></td>
    `;
    cartTableBody.appendChild(tr);
  });
  updateTotal();
}

function increaseQty(index) {
  const cartItem  = DB.cart[index];
  const stockItem = DB.stock.find(s=>s.barcode===cartItem.barcode);
  if (stockItem&&cartItem.qty>=stockItem.qty) { alert("لا يوجد مخزون كافٍ!"); return; }
  cartItem.qty+=1; saveDB(); renderSaleStock();
}

function decreaseQty(index) {
  DB.cart[index].qty-=1;
  if (DB.cart[index].qty<=0) DB.cart.splice(index,1);
  saveDB(); renderSaleStock();
}

function addItem() {
  const val = searchInput.value.trim().toLowerCase();
  if (!val) { alert("أدخل اسم السلعة أو الباركود"); return; }
  const item = DB.stock.find(i=>i.type.toLowerCase().includes(val)||i.barcode.includes(val));
  if (!item) { alert("المنتج غير موجود في المخزون"); return; }
  if (item.qty<=0) { alert("هذا المنتج نفذ من المخزون!"); return; }

  const cartItem = DB.cart.find(c=>c.barcode===item.barcode);
  if (cartItem) {
    if (cartItem.qty>=item.qty) { alert("لا يوجد مخزون كافٍ!"); return; }
    cartItem.qty+=1;
  } else {
    DB.cart.push({name:item.type, barcode:item.barcode, price:item.price, costPrice:item.costPrice, qty:1});
  }
  searchInput.value=""; saveDB(); renderSaleStock();
}

function removeFromCart(index) {
  DB.cart.splice(index,1); saveDB(); renderSaleStock();
}

function updateTotal() {
  const total = DB.cart.reduce((s,i)=>s+i.price*i.qty, 0);
  totalEl.textContent = formatPrice(total);
}

/* =======================
   PAYMENT FUNCTIONS
======================= */
function getCartTotal() { return DB.cart.reduce((s,i)=>s+i.price*i.qty, 0); }

function deductStock() {
  DB.cart.forEach(cItem=>{
    const s=DB.stock.find(s=>s.barcode===cItem.barcode);
    if (s) s.qty-=cItem.qty;
  });
}

function buildSale(type, paid) {
  const invoiceNum = DB.settings.invoiceNum || 1;
  DB.settings.invoiceNum = invoiceNum + 1; // تحديث رقم الفاتورة
  return {
    invoiceNum,
    date: new Date().toISOString(),
    customer: custSelect.value || "زبون عادي",
    type, paid: paid||0,
    total: getCartTotal(),
    items: DB.cart.map(i=>({
      name:i.name, barcode:i.barcode,
      price:i.price, cost:i.costPrice||0, qty:i.qty
    }))
  };
}

function pay() {
  if (!DB.cart.length) { alert("لا يوجد منتجات في العربة!"); return; }
  const paidVal = parseFloat(document.getElementById("paid").value);
  const total   = getCartTotal();
  if (!isNaN(paidVal)&&paidVal<total) {
    alert(`المبلغ المدفوع (${formatPrice(paidVal)}) أقل من الإجمالي (${formatPrice(total)})`); return;
  }
  const change = !isNaN(paidVal)?paidVal-total:0;
  deductStock();
  DB.sales.push(buildSale("كامل", paidVal||total));
  DB.cart=[]; document.getElementById("paid").value="";
  saveDB();
  if (change>0) alert(`✅ تم البيع!\nالباقي للزبون: ${formatPrice(change)}`);
  else alert("✅ تم تسجيل البيع بنجاح!");
  renderSaleStock(); renderReports();
}

function partial() {
  if (!DB.cart.length) { alert("لا يوجد منتجات في العربة!"); return; }
  const paidVal = parseFloat(document.getElementById("paid").value);
  const total   = getCartTotal();
  if (isNaN(paidVal)||paidVal<=0) { alert("أدخل المبلغ المدفوع جزئياً"); return; }
  if (paidVal>=total) { alert("المبلغ يغطي الكل، استخدم 'تسديد'"); return; }

  const remaining    = total-paidVal;
  const customerName = custSelect.value||"زبون عادي";
  const customer     = DB.customers.find(c=>c.name===customerName);
  const debtRecord   = {date:new Date().toISOString(), total, paid:paidVal, remaining};
  if (customer) { customer.debts=customer.debts||[]; customer.debts.push(debtRecord); }

  deductStock();
  DB.sales.push(buildSale("جزئي", paidVal));
  DB.debts=DB.debts||[];
  DB.debts.push({customer:customerName, ...debtRecord});
  DB.cart=[]; document.getElementById("paid").value="";
  saveDB();
  alert(`✅ دفع جزئي!\nمدفوع: ${formatPrice(paidVal)}\nمتبقي: ${formatPrice(remaining)}`);
  renderSaleStock(); renderReports();
}

function toDebt() {
  if (!DB.cart.length) { alert("لا يوجد منتجات في العربة!"); return; }
  const customerName = custSelect.value;
  if (!customerName) { alert("اختر زبوناً لتسجيل الدين عليه"); return; }
  const total    = getCartTotal();
  const customer = DB.customers.find(c=>c.name===customerName);
  const debtRecord = {date:new Date().toISOString(), total, paid:0, remaining:total};
  if (customer) { customer.debts=customer.debts||[]; customer.debts.push(debtRecord); }

  deductStock();
  DB.sales.push(buildSale("دين", 0));
  DB.debts=DB.debts||[];
  DB.debts.push({customer:customerName, ...debtRecord});
  DB.cart=[]; saveDB();
  alert(`✅ تم تسجيل الدين على ${customerName}\nالمبلغ: ${formatPrice(total)}`);
  renderSaleStock(); renderReports();
}

/* =======================
   FINANCIAL REPORTS — محدّثة
======================= */
let currentReportTab = "daily";

function switchReportTab(tab, btn) {
  currentReportTab = tab;
  document.querySelectorAll(".rtab").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  renderReports();
}

function filterSalesByPeriod(tab) {
  const now = new Date();
  return (DB.sales||[]).filter(sale=>{
    const d = new Date(sale.date);
    if (tab==="daily")   return isSameDay(d,now);
    if (tab==="weekly")  return isSameWeek(d,now);
    if (tab==="monthly") return isSameMonth(d,now);
    if (tab==="yearly")  return isSameYear(d,now);
    return true; // all
  });
}

function renderReports() {
  const sales = filterSalesByPeriod(currentReportTab);
  let revenue=0, cost=0;
  sales.forEach(sale=>{
    sale.items.forEach(i=>{
      revenue += i.price*i.qty;
      cost    += (i.cost||0)*i.qty;
    });
  });
  const profit = revenue-cost;

  document.getElementById("rSales").textContent   = sales.length;
  document.getElementById("rRevenue").textContent = formatPrice(revenue);
  document.getElementById("rCost").textContent    = formatPrice(cost);
  document.getElementById("rProfit").textContent  = formatPrice(profit);

  // ---- تتبع الديون ----
  renderDebts();

  // ---- سجل العمليات ----
  renderSalesLog(sales);
}

function renderDebts() {
  const allDebts = DB.debts || [];
  // تجميع الديون حسب الزبون
  const byCustomer = {};
  allDebts.forEach(d=>{
    if (!byCustomer[d.customer]) byCustomer[d.customer] = 0;
    byCustomer[d.customer] += d.remaining||0;
  });
  // حساب الإجمالي
  const totalDebt  = Object.values(byCustomer).reduce((s,v)=>s+v, 0);
  const debtCount  = Object.keys(byCustomer).filter(k=>byCustomer[k]>0).length;

  document.getElementById("rTotalDebt").textContent = formatPrice(totalDebt);
  document.getElementById("rDebtCount").textContent = debtCount;

  const debtList = document.getElementById("debtList");
  debtList.innerHTML = "";
  const entries = Object.entries(byCustomer).filter(([,v])=>v>0);
  if (!entries.length) {
    debtList.innerHTML = "<li style='color:#6b7280;text-align:center'>لا توجد ديون 🎉</li>";
    return;
  }
  entries.forEach(([name, amount])=>{
    const li = document.createElement("li");
    li.style.cssText = "display:flex;justify-content:space-between;align-items:center;padding:8px 4px;border-bottom:1px solid #eee";
    li.innerHTML = `
      <span>👤 <strong>${name}</strong></span>
      <div style="display:flex;align-items:center;gap:8px">
        <span style="color:#ef4444;font-weight:700">${formatPrice(amount)}</span>
        <button onclick="settleDebt('${name}')" style="background:#10b981;padding:4px 10px;font-size:13px">تسوية</button>
      </div>
    `;
    debtList.appendChild(li);
  });
}

function settleDebt(customerName) {
  const amount = prompt(`تسوية دين ${customerName}\nأدخل المبلغ المدفوع:`);
  if (!amount || isNaN(amount) || Number(amount) <= 0) return;
  const pay = parseFloat(amount);
  let remaining = pay;
  // طرح المبلغ من الديون
  (DB.debts||[]).forEach(d=>{
    if (d.customer===customerName && d.remaining>0 && remaining>0) {
      const deduct = Math.min(d.remaining, remaining);
      d.remaining -= deduct;
      d.paid      += deduct;
      remaining   -= deduct;
    }
  });
  // تحديث زبون أيضاً
  const customer = DB.customers.find(c=>c.name===customerName);
  if (customer) {
    let rem2 = pay;
    (customer.debts||[]).forEach(d=>{
      if (d.remaining>0 && rem2>0) {
        const deduct = Math.min(d.remaining, rem2);
        d.remaining -= deduct; rem2 -= deduct;
      }
    });
  }
  saveDB();
  alert(`✅ تم تسجيل دفع ${formatPrice(pay)} من ${customerName}`);
  renderDebts();
}

function renderSalesLog(sales) {
  const salesLog = document.getElementById("salesLog");
  salesLog.innerHTML = "";
  if (!sales.length) {
    salesLog.innerHTML = "<li style='color:#6b7280;text-align:center'>لا توجد عمليات</li>";
    return;
  }
  // عرض الأحدث أولاً
  [...sales].reverse().forEach(sale=>{
    const li = document.createElement("li");
    li.style.cssText = "padding:8px 4px;border-bottom:1px solid #eee;font-size:14px";
    const typeColor = sale.type==="كامل"?"#10b981":sale.type==="جزئي"?"#f59e0b":"#ef4444";
    li.innerHTML = `
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:4px">
        <span>
          ${sale.invoiceNum?`<strong>#${sale.invoiceNum}</strong> | `:""}
          <span style="color:${typeColor};font-weight:600">${sale.type}</span>
          | 👤 ${sale.customer}
        </span>
        <span style="font-weight:700">${formatPrice(sale.total)}</span>
      </div>
      <div style="color:#6b7280;font-size:12px">${formatDate(sale.date)}</div>
    `;
    salesLog.appendChild(li);
  });
}

/* =======================
   CLOCK & DATE
======================= */
function startClock() {
  function updateTime() {
    const now  = new Date();
    const fmt  = DB.settings.timeFormat || "24";
    const opts = fmt==="12"
      ? {hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:true}
      : {hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false};
    currentTimeEl.textContent = now.toLocaleTimeString("ar-DZ", opts);
    currentDateEl.textContent = formatDate(now.toISOString());
  }
  updateTime(); setInterval(updateTime, 1000);
}

/* =======================
   MENU TOGGLE
======================= */
menuBtn.addEventListener("click", ()=>{ sideMenu.classList.toggle("hidden"); });

document.addEventListener("click", (e)=>{
  if (!sideMenu.contains(e.target)&&e.target!==menuBtn) {
    sideMenu.classList.add("hidden");
  }
});

/* =======================
   INITIALIZATION
======================= */
addUserForm.addEventListener("submit", addUser);
addUserInAlerts.addEventListener("submit", addUserInAlertsFunc);

renderUsersTable();
renderUserSelect();
renderStock();
renderSaleStock();
renderCustomerSelect();
renderCustomerList();

const logged = JSON.parse(localStorage.getItem("POSDZ_LOGGED"));
if (logged) {
  loginScreen.style.display = "none";
  mainApp.style.display = "block";
  applyHeader();
  showSale();
  startClock();
} else {
  loginScreen.style.display = "flex";
  mainApp.style.display = "none";
}
