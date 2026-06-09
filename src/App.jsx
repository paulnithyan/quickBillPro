import { useState, useEffect, useRef } from "react";

/* ─── helpers ─────────────────────────────────────────── */
const uid  = () => Math.random().toString(36).slice(2,8).toUpperCase();
const inr  = n  => "₹" + Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:0});
const fmtD = d  => new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
const fmtT = d  => new Date(d).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"});
const ago  = d  => { const m=Math.floor((Date.now()-new Date(d))/60000); if(m<1)return"just now"; if(m<60)return m+"m ago"; const h=Math.floor(m/60); if(h<24)return h+"h ago"; return Math.floor(h/24)+"d ago"; };
const calcTotals = (items,disc,tax) => {
  const sub = items.reduce((s,it)=>s+(parseInt(it.q)||0)*(parseFloat(it.p)||0),0);
  const d   = sub*(parseFloat(disc)||0)/100;
  const t   = (sub-d)*(parseFloat(tax)||0)/100;
  return {sub,disc:d,tax:t,grand:sub-d+t};
};

/* ─── seed data ─────────────────────────────────────────── */
const INIT_PRODUCTS = [
  {id:"p1",  code:"8901234567001", name:"Rice 5kg",      price:320, unit:"bag",    cat:"Grains",   stock:80,  minStock:20},
  {id:"p2",  code:"8901234567018", name:"Dal 1kg",       price:120, unit:"kg",     cat:"Grains",   stock:60,  minStock:15},
  {id:"p3",  code:"8901234567025", name:"Wheat 5kg",     price:280, unit:"bag",    cat:"Grains",   stock:45,  minStock:10},
  {id:"p4",  code:"8901234567032", name:"Oil 1L",        price:180, unit:"bottle", cat:"Cooking",  stock:90,  minStock:20},
  {id:"p5",  code:"8901234567049", name:"Butter 500g",   price:240, unit:"pack",   cat:"Dairy",    stock:30,  minStock:10},
  {id:"p6",  code:"8901234567056", name:"Milk 1L",       price:60,  unit:"packet", cat:"Dairy",    stock:100, minStock:30},
  {id:"p7",  code:"8901234567063", name:"Curd 500g",     price:45,  unit:"cup",    cat:"Dairy",    stock:50,  minStock:15},
  {id:"p8",  code:"8901234567070", name:"Sugar 1kg",     price:55,  unit:"kg",     cat:"Cooking",  stock:70,  minStock:20},
  {id:"p9",  code:"8901234567087", name:"Salt 1kg",      price:25,  unit:"pack",   cat:"Cooking",  stock:120, minStock:30},
  {id:"p10", code:"8901234567094", name:"Turmeric",      price:45,  unit:"pkt",    cat:"Spices",   stock:40,  minStock:10},
  {id:"p11", code:"8901234567101", name:"Chilli Powder", price:60,  unit:"pkt",    cat:"Spices",   stock:35,  minStock:10},
  {id:"p12", code:"8901234567118", name:"Biscuits",      price:30,  unit:"pkt",    cat:"Snacks",   stock:200, minStock:50},
  {id:"p13", code:"8901234567125", name:"Shampoo",       price:150, unit:"bottle", cat:"Personal", stock:25,  minStock:8},
  {id:"p14", code:"8901234567132", name:"Soap",          price:40,  unit:"bar",    cat:"Personal", stock:150, minStock:40},
  {id:"p15", code:"8901234567149", name:"Toothpaste",    price:85,  unit:"tube",   cat:"Personal", stock:60,  minStock:15},
];

const NOW = Date.now();
const INIT_BILLS = [
  {id:"RX4K2M", date:new Date(NOW-18*60000),  custName:"Ravi Kumar",    custPhone:"9876543210", items:[{n:"Rice 5kg",q:2,p:320},{n:"Dal 1kg",q:3,p:120},{n:"Oil 1L",q:1,p:180}],   sub:1220,disc:0,   tax:61,   grand:1281,  status:"pending",  staff:"Suresh", payment:"cash"},
  {id:"PY8N3Q", date:new Date(NOW-45*60000),  custName:"Priya Devi",    custPhone:"9123456789", items:[{n:"Sugar 1kg",q:2,p:55},{n:"Salt 1kg",q:1,p:25},{n:"Biscuits",q:4,p:30}],  sub:245, disc:24.5,tax:0,    grand:220.5, status:"verified", staff:"Suresh", payment:"upi"},
  {id:"MH6L9T", date:new Date(NOW-80*60000),  custName:"Mohan Lal",     custPhone:"9988776655", items:[{n:"Wheat 5kg",q:1,p:280},{n:"Turmeric",q:2,p:45}],                          sub:370, disc:0,   tax:18.5,  grand:388.5, status:"verified", staff:"Anand",  payment:"card"},
  {id:"SB2V7W", date:new Date(NOW-2*3600000), custName:"Sunita Bai",    custPhone:"9765432108", items:[{n:"Shampoo",q:2,p:150},{n:"Soap",q:3,p:40},{n:"Toothpaste",q:2,p:85}],      sub:590, disc:59,  tax:0,    grand:531,   status:"pending",  staff:"Suresh", payment:"cash"},
  {id:"AR5D1F", date:new Date(NOW-3*3600000), custName:"Arjun Singh",   custPhone:"9654321087", items:[{n:"Milk 1L",q:5,p:60},{n:"Curd 500g",q:2,p:45},{n:"Butter 500g",q:1,p:240}],sub:630, disc:0,   tax:31.5, grand:661.5, status:"verified", staff:"Anand",  payment:"upi"},
  {id:"KR3J8E", date:new Date(NOW-5*3600000), custName:"Kavitha Reddy", custPhone:"9543210976", items:[{n:"Chilli Powder",q:3,p:60},{n:"Turmeric",q:2,p:45}],                        sub:270, disc:0,   tax:13.5, grand:283.5, status:"cancelled",staff:"Suresh", payment:"cash"},
];

const INIT_CUSTOMERS = [
  {id:"c1", name:"Ravi Kumar",    phone:"9876543210", email:"ravi@email.com",   address:"New Delhi",     totalSpent:12450, bills:14, points:1245, tier:"gold",     joined:new Date(NOW-90*86400000)},
  {id:"c2", name:"Priya Devi",    phone:"9123456789", email:"priya@email.com",  address:"Mumbai",        totalSpent:5820,  bills:8,  points:582,  tier:"silver",   joined:new Date(NOW-60*86400000)},
  {id:"c3", name:"Mohan Lal",     phone:"9988776655", email:"mohan@email.com",  address:"Bangalore",     totalSpent:890,   bills:3,  points:89,   tier:"bronze",   joined:new Date(NOW-30*86400000)},
  {id:"c4", name:"Arjun Singh",   phone:"9654321087", email:"arjun@email.com",  address:"Chennai",       totalSpent:24600, bills:28, points:2460, tier:"platinum", joined:new Date(NOW-180*86400000)},
  {id:"c5", name:"Sunita Bai",    phone:"9765432108", email:"sunita@email.com", address:"Hyderabad",     totalSpent:3200,  bills:6,  points:320,  tier:"bronze",   joined:new Date(NOW-45*86400000)},
];

const INIT_STAFF = [
  {id:"s1", name:"Suresh",  role:"cashier", bills:42, sales:38200, joined:new Date(NOW-120*86400000), active:true,  pin:"2222"},
  {id:"s2", name:"Anand",   role:"cashier", bills:31, sales:29400, joined:new Date(NOW-90*86400000),  active:true,  pin:"3333"},
  {id:"s3", name:"Meena",   role:"manager", bills:0,  sales:0,     joined:new Date(NOW-60*86400000),  active:false, pin:"4444"},
];

/* ─── CSS ─────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#06090F;--s0:#0B1018;--s1:#0F1620;--s2:#141D2A;--s3:#192232;--s4:#1F2A3C;
  --b0:#192232;--b1:#202D3F;--b2:#283A54;
  --t0:#EEF2FF;--t1:#BEC9E2;--t2:#8593AA;--t3:#566075;
  --blue:#4F8CF5;--blue2:#74AAFF;--pur:#9880FA;
  --grn:#28D4A0;--grn2:#1DB888;
  --ylw:#F9C240;--ylw2:#E6AE30;
  --red:#F47070;--red2:#E05050;
  --r:8px;--rL:12px;--rX:18px;
}
html,body{font-family:'Plus Jakarta Sans',sans-serif;background:var(--bg);color:var(--t0);min-height:100vh;overflow-x:hidden}
input,select,button,textarea{font-family:inherit}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-thumb{background:var(--b2);border-radius:4px}

/* LOGIN */
.login-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(79,140,245,.18),transparent 70%)}
.login-card{background:var(--s1);border:1px solid var(--b1);border-radius:var(--rX);padding:38px 30px;width:100%;max-width:430px;box-shadow:0 16px 48px rgba(0,0,0,.6)}
.login-logo{font-family:'Syne';font-size:26px;font-weight:800;text-align:center;margin-bottom:2px}
.login-logo em{color:var(--blue2);font-style:normal}
.login-sub{text-align:center;font-size:10px;color:var(--t3);letter-spacing:.6px;text-transform:uppercase;margin-bottom:22px}
.role-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px}
.role-btn{background:var(--s2);border:2px solid var(--b1);border-radius:var(--rL);padding:16px 10px;text-align:center;cursor:pointer;transition:all .15s}
.role-btn.on{border-color:var(--blue);background:rgba(79,140,245,.1)}
.role-btn:hover{background:var(--s3)}
.role-ico{font-size:28px;margin-bottom:6px}
.role-lbl{font-family:'Syne';font-size:12px;font-weight:700}
.fl{font-size:10px;font-weight:700;color:var(--t2);margin:12px 0 5px;display:block;text-transform:uppercase;letter-spacing:.4px}
.fi{width:100%;background:var(--s2);border:1.5px solid var(--b1);border-radius:var(--r);padding:10px 12px;font-size:13px;color:var(--t0);outline:none;transition:border .15s}
.fi:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(79,140,245,.12)}
.login-go{width:100%;margin-top:14px;padding:12px;background:linear-gradient(135deg,var(--blue),var(--pur));border:none;color:#fff;font-size:13px;font-weight:700;border-radius:var(--r);cursor:pointer;letter-spacing:.3px}
.login-go:hover{opacity:.88}
.forgot{font-size:10px;color:var(--blue);cursor:pointer;text-align:center;margin-top:8px;display:block}

/* SHELL */
.shell{display:flex;min-height:100vh}
.sb{width:220px;background:var(--s0);border-right:1px solid var(--b0);position:fixed;top:0;left:0;height:100vh;z-index:80;display:flex;flex-direction:column;transition:transform .25s}
.sb-logo{padding:14px 16px;border-bottom:1px solid var(--b0);font-family:'Syne';font-size:17px;font-weight:800;display:flex;align-items:center;gap:7px;cursor:pointer}
.sb-logo em{color:var(--blue2);font-style:normal}
.sb-user{padding:10px 14px;border-bottom:1px solid var(--b0);display:flex;align-items:center;gap:8px;font-size:11px}
.sb-av{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--blue),var(--pur));display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0}
.sb-nav{flex:1;overflow-y:auto;padding:6px 0}
.sb-item{display:flex;align-items:center;gap:10px;padding:11px 14px;cursor:pointer;border-left:3px solid transparent;transition:all .12s;position:relative}
.sb-item:hover{background:var(--s2)}
.sb-item.on{background:var(--s2);border-left-color:var(--blue)}
.sb-item.on .sb-lbl{color:var(--blue2);font-weight:700}
.sb-lbl{font-size:12px;color:var(--t1)}
.sb-badge{margin-left:auto;background:var(--red);color:#fff;border-radius:99px;padding:1px 6px;font-size:9px;font-weight:700}
.sb-out{padding:12px 14px;border-top:1px solid var(--b0);cursor:pointer;font-size:11px;color:var(--t2);transition:color .12s}
.sb-out:hover{color:var(--red)}
.main{flex:1;margin-left:220px;display:flex;flex-direction:column;height:100vh;overflow:hidden}
.topbar{background:var(--s1);border-bottom:1px solid var(--b0);height:50px;display:flex;align-items:center;justify-content:space-between;padding:0 20px;flex-shrink:0;z-index:40}
.tb-left{display:flex;align-items:center;gap:10px}
.tb-title{font-family:'Syne';font-size:15px;font-weight:700}
.tb-right{display:flex;align-items:center;gap:16px;font-size:10px;color:var(--t2)}
.menu-btn{display:none;background:none;border:none;color:var(--t0);font-size:18px;cursor:pointer}
.content{flex:1;overflow-y:auto;padding:18px 20px}

/* COMMON */
.page-hd{margin-bottom:16px}
.page-title{font-family:'Syne';font-size:18px;font-weight:800;display:flex;align-items:center;gap:8px;margin-bottom:4px}
.page-sub{font-size:10px;color:var(--t3)}
.panel{background:var(--s2);border:1px solid var(--b1);border-radius:var(--rL);margin-bottom:12px;overflow:hidden}
.ph{background:var(--s3);padding:10px 14px;border-bottom:1px solid var(--b1);display:flex;align-items:center;justify-content:space-between}
.ph-title{font-family:'Syne';font-size:11px;font-weight:700}
.pb{padding:12px 14px}
.inp{width:100%;background:var(--s3);border:1.5px solid var(--b1);border-radius:var(--r);padding:9px 11px;font-size:12px;color:var(--t0);outline:none;transition:border .12s;font-family:inherit}
.inp:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(79,140,245,.1)}
.inp-lbl{display:block;font-size:9px;font-weight:700;color:var(--t2);margin-bottom:4px;text-transform:uppercase;letter-spacing:.3px}
.inp-grp{margin-bottom:10px}
.btn{border:none;border-radius:var(--r);padding:9px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;transition:opacity .12s;display:inline-flex;align-items:center;gap:5px}
.btn:hover{opacity:.85}
.btn-blue{background:var(--blue);color:#fff}
.btn-grn{background:var(--grn);color:#000}
.btn-ylw{background:var(--ylw);color:#000}
.btn-red{background:rgba(244,112,112,.15);color:var(--red);border:1px solid rgba(244,112,112,.3)}
.btn-ghost{background:var(--s3);color:var(--t1);border:1px solid var(--b1)}
.btn-pur{background:var(--pur);color:#fff}
.btn-sm{padding:5px 10px;font-size:10px}
.kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:14px}
.kpi{background:var(--s2);border:1px solid var(--b1);border-radius:var(--rL);padding:14px 12px}
.kpi-lbl{font-size:9px;color:var(--t3);font-weight:600;text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px}
.kpi-val{font-family:'Syne';font-size:20px;font-weight:800}
.kpi-chg{font-size:9px;margin-top:4px}
.tag{display:inline-block;padding:2px 8px;border-radius:99px;font-size:9px;font-weight:700}
.tag-grn{background:rgba(40,212,160,.12);color:var(--grn)}
.tag-ylw{background:rgba(249,194,64,.12);color:var(--ylw)}
.tag-red{background:rgba(244,112,112,.12);color:var(--red)}
.tag-blue{background:rgba(79,140,245,.12);color:var(--blue2)}
.tag-pur{background:rgba(152,128,250,.12);color:var(--pur)}

/* SCANNER */
.scanner-box{background:var(--s3);border:1.5px solid var(--b1);border-radius:var(--rL);padding:12px;margin-bottom:12px}
.scanner-inp{width:100%;background:var(--s2);border:1.5px solid var(--b1);border-radius:var(--r);padding:10px 12px;font-size:13px;color:var(--t0);outline:none;transition:border .12s;font-family:inherit}
.scanner-inp:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(79,140,245,.1)}
.scan-result{background:rgba(40,212,160,.08);border:1px solid rgba(40,212,160,.2);border-radius:var(--r);padding:10px 12px;display:flex;align-items:center;justify-content:space-between;margin-top:8px}

/* ITEMS */
.item-row{background:var(--s3);border-left:3px solid var(--blue);border-radius:var(--r);padding:8px 10px;margin-bottom:7px;display:flex;align-items:center;gap:8px;font-size:11px}
.qty-ctrl{display:flex;align-items:center;gap:4px}
.qty-btn{background:none;border:1px solid var(--b2);border-radius:4px;color:var(--blue);cursor:pointer;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700}
.qty-inp{width:36px;background:var(--s2);border:1px solid var(--b1);border-radius:4px;padding:3px 4px;font-size:11px;color:var(--t0);text-align:center;outline:none;font-family:inherit}

/* RECEIPT */
.receipt{background:#fff;color:#111;font-family:'Courier New',monospace;font-size:10px;line-height:1.6;padding:14px;border-radius:var(--r);max-width:300px;margin:0 auto}
.rcp-center{text-align:center}
.rcp-bold{font-weight:700}
.rcp-hr{border:none;border-top:1px dashed #aaa;margin:6px 0}
.rcp-row{display:flex;justify-content:space-between}

/* MODAL */
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:100;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(3px)}
.modal{background:var(--s1);border:1px solid var(--b1);border-radius:var(--rX);width:100%;max-width:500px;max-height:88vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.7)}
.modal-lg{max-width:700px}
.mh{background:var(--s2);padding:14px 18px;border-bottom:1px solid var(--b1);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0}
.mh-title{font-family:'Syne';font-size:14px;font-weight:700}
.mclose{background:none;border:none;color:var(--t2);font-size:20px;cursor:pointer;width:26px;height:26px;display:flex;align-items:center;justify-content:center;border-radius:4px}
.mclose:hover{background:var(--s3);color:var(--t0)}
.mbody{padding:18px}

/* BILL CARD */
.bill-card{background:var(--s2);border:1px solid var(--b1);border-radius:var(--rL);padding:12px 14px;margin-bottom:8px;cursor:pointer;transition:border .12s;display:flex;justify-content:space-between;align-items:center}
.bill-card:hover{border-color:var(--b2)}
.bc-id{font-family:'Syne';font-size:11px;font-weight:700;color:var(--blue2);margin-bottom:3px}
.bc-cust{font-size:12px;font-weight:600;margin-bottom:2px}
.bc-meta{font-size:9px;color:var(--t3)}
.bc-amt{font-family:'Syne';font-size:14px;font-weight:800;color:var(--ylw);text-align:right;margin-bottom:3px}

/* PROD GRID */
.prod-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:7px}
.prod-tile{background:var(--s3);border:1px solid var(--b1);border-radius:var(--r);padding:8px;cursor:pointer;transition:all .12s;text-align:center}
.prod-tile:hover{background:var(--s4);border-color:var(--blue);transform:translateY(-1px)}
.pt-name{font-size:10px;font-weight:600;margin-bottom:3px;line-height:1.3}
.pt-price{font-size:11px;color:var(--ylw);font-weight:700}
.pt-unit{font-size:8px;color:var(--t3);margin-top:2px}

/* CHART */
.bar-chart{display:flex;align-items:flex-end;gap:6px;height:80px;padding:0 4px}
.bar-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px}
.bar{border-radius:3px 3px 0 0;width:100%;min-height:3px;transition:height .4s}
.bar-lbl{font-size:7px;color:var(--t3)}

/* TABLE */
.tbl{width:100%;border-collapse:collapse;font-size:11px}
.tbl th{background:var(--s3);padding:8px 10px;text-align:left;font-size:9px;font-weight:700;color:var(--t2);text-transform:uppercase;letter-spacing:.3px}
.tbl td{padding:9px 10px;border-bottom:1px solid var(--b0)}
.tbl tr:last-child td{border-bottom:none}
.tbl tr:hover td{background:var(--s3)}

/* TOAST */
.toast{position:fixed;bottom:22px;right:22px;background:var(--s2);border:1px solid var(--b1);border-radius:var(--rL);padding:11px 16px;font-size:11px;z-index:999;box-shadow:0 8px 24px rgba(0,0,0,.5);animation:toastIn .3s ease}
@keyframes toastIn{from{transform:translateY(60px);opacity:0}to{transform:translateY(0);opacity:1}}

/* ALERT */
.alert{border-radius:var(--r);padding:10px 14px;font-size:11px;margin-bottom:12px;display:flex;align-items:center;gap:8px}
.alert-ylw{background:rgba(249,194,64,.1);border:1px solid rgba(249,194,64,.2);color:var(--ylw)}
.alert-red{background:rgba(244,112,112,.1);border:1px solid rgba(244,112,112,.2);color:var(--red)}
.alert-grn{background:rgba(40,212,160,.1);border:1px solid rgba(40,212,160,.2);color:var(--grn)}

/* LOYALTY */
.tier-badge{display:inline-block;padding:3px 10px;border-radius:99px;font-size:9px;font-weight:700}
.tier-bronze{background:rgba(180,115,70,.2);color:#CD7F32}
.tier-silver{background:rgba(192,192,192,.2);color:#C0C0C0}
.tier-gold{background:rgba(255,215,0,.15);color:#FFD700}
.tier-platinum{background:rgba(229,228,226,.15);color:#E5E4E2}

/* PROGRESS */
.progress-bar{background:var(--s3);border-radius:99px;height:6px;overflow:hidden;margin:6px 0}
.progress-fill{height:100%;border-radius:99px;transition:width .5s}

/* RESPONSIVE */
@media(max-width:900px){
  .sb{transform:translateX(-220px)}
  .sb.open{transform:translateX(0)}
  .main{margin-left:0}
  .menu-btn{display:flex}
  .bill-layout{grid-template-columns:1fr!important}
}
@media print{
  .sb,.topbar,.menu-btn,.scanner-box,.no-print{display:none!important}
  .main{margin-left:0}
  .content{padding:0}
  body{background:#fff;color:#000}
}
`;

/* ─── RECEIPT ────────────────────────────────────────── */
function Receipt({bill,shopName,shopPhone,shopAddr}){
  const items = bill.items||[];
  return(
    <div className="receipt">
      <div className="rcp-center rcp-bold" style={{fontSize:13,marginBottom:2}}>{shopName}</div>
      <div className="rcp-center" style={{fontSize:9,color:'#555',marginBottom:2}}>{shopAddr}</div>
      <div className="rcp-center" style={{fontSize:9,color:'#555',marginBottom:6}}>📞 {shopPhone}</div>
      <hr className="rcp-hr"/>
      <div className="rcp-row"><span style={{fontWeight:700}}>Bill #{bill.id}</span><span>{fmtD(bill.date)}</span></div>
      <div style={{marginBottom:4,fontSize:9,color:'#555'}}>{fmtT(bill.date)} · Staff: {bill.staff}</div>
      {bill.custName&&<div style={{fontSize:9,marginBottom:6}}>Customer: {bill.custName} {bill.custPhone&&`| ${bill.custPhone}`}</div>}
      <hr className="rcp-hr"/>
      {items.map((it,i)=>(
        <div key={i}>
          <div style={{fontWeight:600}}>{it.n}</div>
          <div className="rcp-row" style={{fontSize:9,color:'#555'}}>
            <span>{it.q} × {inr(it.p)}</span>
            <span>{inr((parseInt(it.q)||0)*(parseFloat(it.p)||0))}</span>
          </div>
        </div>
      ))}
      <hr className="rcp-hr"/>
      <div className="rcp-row"><span>Subtotal</span><span>{inr(bill.sub)}</span></div>
      {bill.disc>0&&<div className="rcp-row" style={{color:'#e05050'}}><span>Discount</span><span>-{inr(bill.disc)}</span></div>}
      {bill.tax>0&&<div className="rcp-row"><span>Tax</span><span>+{inr(bill.tax)}</span></div>}
      <hr className="rcp-hr"/>
      <div className="rcp-row rcp-bold" style={{fontSize:12,marginTop:2}}><span>TOTAL</span><span>{inr(bill.grand)}</span></div>
      {bill.payment&&<div style={{fontSize:9,color:'#555',marginTop:4}}>Payment: {bill.payment.toUpperCase()}</div>}
      <hr className="rcp-hr"/>
      <div className="rcp-center" style={{fontSize:8,color:'#888',marginTop:4}}>Thank you for shopping!<br/>Visit again 🙏</div>
    </div>
  );
}

/* ─── MAIN APP ──────────────────────────────────────── */
export default function QuickBillPro(){
  /* auth */
  const [user,setUser]         = useState(null);
  const [lRole,setLRole]       = useState(null);
  const [lName,setLName]       = useState("");
  const [lPin,setLPin]         = useState("");

  /* data */
  const [bills,setBills]       = useState(INIT_BILLS);
  const [products,setProducts] = useState(INIT_PRODUCTS);
  const [customers,setCustomers]= useState(INIT_CUSTOMERS);
  const [staffList,setStaffList]= useState(INIT_STAFF);

  /* ui */
  const [page,setPage]         = useState("dashboard");
  const [sbOpen,setSbOpen]     = useState(true);
  const [toast,setToast]       = useState("");
  const [modal,setModal]       = useState(null); // {type,data}

  /* bill form */
  const [custName,setCustName] = useState("");
  const [custPhone,setCustPhone]= useState("");
  const [items,setItems]       = useState([]);
  const [discPct,setDiscPct]   = useState(0);
  const [taxPct,setTaxPct]     = useState(5);
  const [payMethod,setPayMethod]= useState("cash");
  const [barcode,setBarcode]   = useState("");
  const [scanHit,setScanHit]   = useState(null);
  const [prodSearch,setProdSearch]= useState("");

  /* settings */
  const [shopName,setShopName] = useState("QuickBill Pro");
  const [shopAddr,setShopAddr] = useState("123 Market Street, Delhi");
  const [shopPhone,setShopPhone]= useState("9876543210");
  const [ownerPin,setOwnerPin] = useState("1234");

  /* filters */
  const [billFilter,setBillFilter]= useState("all");
  const [custFilter,setCustFilter]= useState("");
  const [prodFilter,setProdFilter]= useState("All");

  /* add product form */
  const [newProd,setNewProd]   = useState({name:"",price:"",unit:"pcs",cat:"General",code:"",stock:"",minStock:""});

  const notify = (m) => { setToast(m); setTimeout(()=>setToast(""),2800); };
  const nav = (p) => { setPage(p); setSbOpen(false); };
  const openModal = (type,data={}) => setModal({type,data});
  const closeModal = () => setModal(null);

  /* ── scan ── */
  const doScan = (code) => {
    const q = code.trim().toLowerCase();
    const found = products.find(p=>
      p.id===code || p.code===code ||
      p.name.toLowerCase().includes(q)
    );
    if(found){
      setScanHit(found);
      setTimeout(()=>{
        addItem(found);
        setBarcode(""); setScanHit(null);
        notify("✅ "+found.name+" added!");
      },1200);
    } else {
      notify("❌ Product not found"); setBarcode("");
    }
  };

  const addItem = (prod) => {
    setItems(prev=>[...prev,{id:uid(),n:prod.name,q:1,p:prod.price}]);
  };

  /* ── save bill ── */
  const saveBill = () => {
    if(!items.length){ notify("⚠️ Add at least one product"); return; }
    const {sub,disc,tax,grand} = calcTotals(items,discPct,taxPct);
    const bill = {
      id:uid(), date:new Date(),
      custName:custName||"Walk-in", custPhone,
      items, sub, disc, tax, grand,
      status:"pending", staff:user.name,
      payment:payMethod,
    };
    setBills(p=>[bill,...p]);
    /* update customer stats */
    if(custPhone){
      setCustomers(prev=>prev.map(c=>{
        if(c.phone===custPhone){
          const pts = Math.floor(grand/10);
          const total = c.totalSpent+grand;
          const tier = total>20000?"platinum":total>10000?"gold":total>5000?"silver":"bronze";
          return {...c, totalSpent:total, bills:c.bills+1, points:c.points+pts, tier};
        }
        return c;
      }));
    }
    /* update stock */
    items.forEach(it=>{
      setProducts(prev=>prev.map(p=>
        p.name===it.n ? {...p, stock:Math.max(0,(p.stock||0)-(it.q||0))} : p
      ));
    });
    /* reset */
    setCustName(""); setCustPhone(""); setItems([]);
    setDiscPct(0); setTaxPct(5); setPayMethod("cash");
    notify("✅ Bill #"+bill.id+" saved!");
  };

  /* ── computed ── */
  const pendingBills = bills.filter(b=>b.status==="pending");
  const todayBills   = bills.filter(b=>new Date(b.date).toDateString()===new Date().toDateString());
  const totalSales   = bills.filter(b=>b.status!=="cancelled").reduce((s,b)=>s+b.grand,0);
  const lowStock     = products.filter(p=>(p.stock||0)<=(p.minStock||0));
  const filteredBills= bills.filter(b=>{
    const mine = user?.role==="staff" ? b.staff===user.name : true;
    const flt  = billFilter==="all" || b.status===billFilter;
    return mine && flt;
  });

  /* ── hours chart data ── */
  const hoursData = Array.from({length:8},(_,i)=>{
    const h = new Date().getHours()-7+i;
    const cnt = bills.filter(b=>new Date(b.date).getHours()===h&&b.status!=="cancelled").reduce((s,b)=>s+b.grand,0);
    return {h:`${h}h`,v:cnt};
  });
  const maxH = Math.max(...hoursData.map(d=>d.v),1);

  /* ─── LOGIN ─── */
  if(!user) return(
    <>
      <style>{CSS}</style>
      <div className="login-wrap">
        <div className="login-card">
          <div className="login-logo">Quick<em>Bill</em> <span style={{fontSize:12,color:"var(--t3)"}}>Pro</span></div>
          <div className="login-sub">Professional Retail Billing v2.0</div>

          <div className="role-row">
            {[["👷","Staff","staff"],["👑","Owner","owner"]].map(([ico,lbl,val])=>(
              <div key={val} className={`role-btn ${lRole===val?"on":""}`} onClick={()=>setLRole(val)}>
                <div className="role-ico">{ico}</div>
                <div className="role-lbl">{lbl}</div>
              </div>
            ))}
          </div>

          <label className="fl">Your Name</label>
          <input className="fi" placeholder="Enter your name" value={lName} onChange={e=>setLName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doLogin()}/>

          {lRole==="owner"&&(
            <>
              <label className="fl">Owner PIN</label>
              <input className="fi" type="password" placeholder="Enter PIN (default 1234)" value={lPin} onChange={e=>setLPin(e.target.value.replace(/\D/g,"").slice(0,6))} onKeyDown={e=>e.key==="Enter"&&doLogin()}/>
            </>
          )}

          <button className="login-go" onClick={doLogin}>Enter App →</button>
          {lRole==="owner"&&<span className="forgot" onClick={()=>notify("Default PIN is 1234")}>Forgot PIN? (Hint: 1234)</span>}
        </div>
      </div>
      {toast&&<div className="toast">{toast}</div>}
    </>
  );

  function doLogin(){
    if(!lRole||!lName.trim()){ notify("⚠️ Select role & enter name"); return; }
    if(lRole==="owner"&&lPin!==ownerPin){ notify("❌ Wrong PIN"); return; }
    setUser({name:lName,role:lRole});
    setPage(lRole==="owner"?"dashboard":"bill");
    setLName(""); setLPin(""); setLRole(null);
  }

  /* ─── PAGES ─── */
  const pages = {
    /* ── BILL ── */
    bill:(
      <div>
        <div className="page-hd"><div className="page-title">🧾 New Bill</div><div className="page-sub">Create professional bills fast</div></div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:16}} className="bill-layout">
          <div>
            {/* scanner */}
            <div className="scanner-box">
              <div style={{fontSize:11,fontWeight:700,marginBottom:8,display:"flex",alignItems:"center",gap:6}}>📱 Scan / Search Product</div>
              <input className="scanner-inp" autoFocus placeholder="Scan barcode, type code (p1,p2...) or product name → Enter"
                value={barcode} onChange={e=>setBarcode(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter"&&barcode.trim()) doScan(barcode.trim()); }}/>
              {scanHit&&(
                <div className="scan-result">
                  <div>
                    <div style={{fontWeight:700,color:"var(--grn)",fontSize:12}}>{scanHit.name}</div>
                    <div style={{fontSize:10,color:"var(--t2)"}}>{inr(scanHit.price)} · {scanHit.unit}</div>
                  </div>
                  <button className="btn btn-grn btn-sm" onClick={()=>{ addItem(scanHit); setBarcode(""); setScanHit(null); notify("✅ Added!"); }}>+ Add</button>
                </div>
              )}
              <div style={{fontSize:9,color:"var(--t3)",marginTop:6}}>💡 Barcode | Code p1–p15 | Product name</div>
            </div>

            {/* customer */}
            <div className="panel">
              <div className="ph"><span className="ph-title">👤 Customer</span><span style={{fontSize:9,color:"var(--t3)"}}>Optional</span></div>
              <div className="pb" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div><label className="inp-lbl">Name</label><input className="inp" placeholder="Customer name" value={custName} onChange={e=>setCustName(e.target.value)}/></div>
                <div><label className="inp-lbl">Phone</label><input className="inp" placeholder="10-digit phone" value={custPhone} onChange={e=>setCustPhone(e.target.value.replace(/\D/g,"").slice(0,10))}/></div>
              </div>
            </div>

            {/* quick products */}
            <div className="panel">
              <div className="ph">
                <span className="ph-title">📦 Quick Add</span>
                <div style={{display:"flex",gap:6}}>
                  <input className="inp" style={{width:120,padding:"4px 8px",fontSize:10}} placeholder="Search..." value={prodSearch} onChange={e=>setProdSearch(e.target.value)}/>
                </div>
              </div>
              <div className="pb">
                <div className="prod-grid">
                  {products.filter(p=>p.name.toLowerCase().includes(prodSearch.toLowerCase())).map(p=>(
                    <div key={p.id} className="prod-tile" onClick={()=>{ addItem(p); notify("✅ "+p.name+" added!"); }}>
                      <div className="pt-name">{p.name}</div>
                      <div className="pt-price">{inr(p.price)}</div>
                      <div className="pt-unit">{p.unit}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* items */}
            <div className="panel">
              <div className="ph"><span className="ph-title">🛒 Items ({items.length})</span></div>
              <div className="pb">
                {items.length===0
                  ? <div style={{textAlign:"center",color:"var(--t3)",padding:20,fontSize:11}}>No items yet — scan or tap a product above</div>
                  : items.map((it,i)=>{
                    const tot=(parseInt(it.q)||0)*(parseFloat(it.p)||0);
                    return(
                      <div key={it.id} className="item-row">
                        <div style={{flex:1,fontWeight:600}}>{it.n}</div>
                        <div className="qty-ctrl">
                          <button className="qty-btn" onClick={()=>setItems(p=>p.map((x,j)=>j===i?{...x,q:Math.max(1,(x.q||1)-1)}:x))}>−</button>
                          <input className="qty-inp" type="number" min="1" value={it.q||1} onChange={e=>setItems(p=>p.map((x,j)=>j===i?{...x,q:parseInt(e.target.value)||1}:x))}/>
                          <button className="qty-btn" onClick={()=>setItems(p=>p.map((x,j)=>j===i?{...x,q:(x.q||1)+1}:x))}>+</button>
                        </div>
                        <div style={{minWidth:50,textAlign:"right",color:"var(--ylw)",fontWeight:700}}>{inr(tot)}</div>
                        <button className="btn btn-red btn-sm" onClick={()=>setItems(p=>p.filter((_,j)=>j!==i))}>✕</button>
                      </div>
                    );
                  })
                }
              </div>
            </div>

            {/* totals */}
            <div className="panel">
              <div className="ph"><span className="ph-title">💰 Payment & Totals</span></div>
              <div className="pb">
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
                  <div><label className="inp-lbl">Discount %</label><input type="number" className="inp" min="0" max="100" value={discPct} onChange={e=>setDiscPct(parseFloat(e.target.value)||0)}/></div>
                  <div><label className="inp-lbl">Tax %</label><input type="number" className="inp" min="0" max="100" value={taxPct} onChange={e=>setTaxPct(parseFloat(e.target.value)||0)}/></div>
                  <div><label className="inp-lbl">Payment</label>
                    <select className="inp" value={payMethod} onChange={e=>setPayMethod(e.target.value)} style={{cursor:"pointer"}}>
                      {["cash","card","upi","wallet","credit"].map(m=><option key={m} value={m}>{m.toUpperCase()}</option>)}
                    </select>
                  </div>
                </div>
                {items.length>0&&(()=>{
                  const {sub,disc,tax,grand}=calcTotals(items,discPct,taxPct);
                  return(
                    <div style={{background:"var(--s3)",borderRadius:"var(--r)",padding:"10px 12px",fontSize:11}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{color:"var(--t2)"}}>Subtotal</span><span>{inr(sub)}</span></div>
                      {disc>0&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:3,color:"var(--red)"}}><span>Discount ({discPct}%)</span><span>−{inr(disc)}</span></div>}
                      {tax>0&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{color:"var(--t2)"}}>Tax ({taxPct}%)</span><span>+{inr(tax)}</span></div>}
                      <div style={{display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:14,color:"var(--ylw)",borderTop:"1px solid var(--b1)",paddingTop:6,marginTop:6}}>
                        <span>TOTAL</span><span>{inr(grand)}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <button className="btn btn-grn" onClick={saveBill}>💾 Save Bill</button>
              <button className="btn btn-ylw" onClick={()=>{ if(!items.length){notify("⚠️ Add items first");return;} const {sub,disc,tax,grand}=calcTotals(items,discPct,taxPct); openModal("print",{id:"PREVIEW",date:new Date(),custName:custName||"Walk-in",custPhone,items,sub,disc,tax,grand,status:"preview",staff:user.name,payment:payMethod}); }}>🖨️ Print Preview</button>
              <button className="btn btn-ghost" onClick={()=>{ setCustName("");setCustPhone("");setItems([]);setDiscPct(0);setTaxPct(5);setPayMethod("cash");setBarcode("");setScanHit(null); notify("🔄 Cleared"); }}>🗑️ Clear</button>
            </div>
          </div>

          {/* receipt preview */}
          <div style={{position:"sticky",top:0,height:"fit-content"}}>
            <div className="panel">
              <div className="ph"><span className="ph-title">📄 Receipt Preview</span></div>
              <div className="pb">
                {items.length>0
                  ? <Receipt bill={{id:"PREVIEW",date:new Date(),custName:custName||"Walk-in",custPhone,items,...calcTotals(items,discPct,taxPct),staff:user.name,payment:payMethod}} shopName={shopName} shopPhone={shopPhone} shopAddr={shopAddr}/>
                  : <div style={{textAlign:"center",color:"var(--t3)",padding:30,fontSize:11}}>Add products to preview receipt</div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    ),

    /* ── DASHBOARD ── */
    dashboard:(
      <div>
        <div className="page-hd"><div className="page-title">📊 Dashboard</div><div className="page-sub">Welcome back, {user.name}!</div></div>

        {pendingBills.length>0&&(
          <div className="alert alert-ylw">⚠️ {pendingBills.length} bill{pendingBills.length>1?"s":""} pending verification
            <button className="btn btn-ylw btn-sm" style={{marginLeft:"auto"}} onClick={()=>nav("bills")}>View →</button>
          </div>
        )}
        {lowStock.length>0&&(
          <div className="alert alert-red">🚨 {lowStock.length} product{lowStock.length>1?"s":""} running low on stock
            <button className="btn btn-red btn-sm" style={{marginLeft:"auto"}} onClick={()=>nav("inventory")}>View →</button>
          </div>
        )}

        <div className="kpi-grid">
          {[
            {lbl:"Today's Sales",    val:inr(todayBills.reduce((s,b)=>s+b.grand,0)), clr:"var(--grn)",  ico:"💰"},
            {lbl:"Today's Bills",    val:todayBills.length,    clr:"var(--blue)", ico:"🧾"},
            {lbl:"Total Revenue",    val:inr(totalSales),      clr:"var(--ylw)",  ico:"📈"},
            {lbl:"Pending Bills",    val:pendingBills.length,  clr:"var(--red)",  ico:"⏳"},
            {lbl:"Customers",        val:customers.length,     clr:"var(--pur)",  ico:"👥"},
            {lbl:"Low Stock Items",  val:lowStock.length,      clr:"var(--ylw2)", ico:"📦"},
          ].map((k,i)=>(
            <div key={i} className="kpi">
              <div className="kpi-lbl">{k.ico} {k.lbl}</div>
              <div className="kpi-val" style={{color:k.clr}}>{k.val}</div>
            </div>
          ))}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div className="panel">
            <div className="ph"><span className="ph-title">📊 Hourly Sales</span></div>
            <div className="pb">
              <div className="bar-chart">
                {hoursData.map((d,i)=>(
                  <div key={i} className="bar-col">
                    <div className="bar" style={{height:d.v/maxH*70+"px",background:"linear-gradient(to top,var(--blue),var(--blue2))"}}/>
                    <div className="bar-lbl">{d.h}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="ph"><span className="ph-title">🏆 Recent Bills</span></div>
            <div className="pb" style={{padding:0}}>
              {bills.slice(0,5).map(b=>(
                <div key={b.id} style={{padding:"8px 12px",borderBottom:"1px solid var(--b0)",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}} onClick={()=>openModal("bill",b)}>
                  <div>
                    <div style={{fontSize:11,fontWeight:600}}>{b.custName}</div>
                    <div style={{fontSize:9,color:"var(--t3)"}}>{ago(b.date)} · {b.staff}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:12,fontWeight:700,color:"var(--ylw)"}}>{inr(b.grand)}</div>
                    <span className={`tag tag-${b.status==="verified"?"grn":b.status==="cancelled"?"red":"ylw"}`}>{b.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* staff performance */}
        <div className="panel">
          <div className="ph"><span className="ph-title">👥 Staff Performance</span></div>
          <div style={{overflowX:"auto"}}>
            <table className="tbl">
              <thead><tr><th>Staff</th><th>Bills</th><th>Sales</th><th>Avg Bill</th><th>Status</th></tr></thead>
              <tbody>
                {staffList.map(s=>(
                  <tr key={s.id}>
                    <td style={{fontWeight:600}}>{s.name}</td>
                    <td>{s.bills}</td>
                    <td style={{color:"var(--ylw)",fontWeight:700}}>{inr(s.sales)}</td>
                    <td>{s.bills>0?inr(Math.round(s.sales/s.bills)):"—"}</td>
                    <td><span className={`tag ${s.active?"tag-grn":"tag-red"}`}>{s.active?"Active":"Inactive"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    ),

    /* ── BILLS ── */
    bills:(
      <div>
        <div className="page-hd"><div className="page-title">📋 {user.role==="staff"?"My Bills":"All Bills"}</div></div>

        <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
          {["all","pending","verified","cancelled"].map(f=>(
            <button key={f} className={`btn btn-sm ${billFilter===f?"btn-blue":"btn-ghost"}`} onClick={()=>setBillFilter(f)}>
              {f.toUpperCase()} {f==="pending"&&pendingBills.length>0&&`(${pendingBills.length})`}
            </button>
          ))}
        </div>

        {filteredBills.length===0
          ? <div style={{textAlign:"center",color:"var(--t3)",padding:40}}>No bills found</div>
          : filteredBills.map(b=>(
            <div key={b.id} className="bill-card" onClick={()=>openModal("bill",b)}>
              <div>
                <div className="bc-id">#{b.id}</div>
                <div className="bc-cust">{b.custName}</div>
                <div className="bc-meta">{fmtD(b.date)} {fmtT(b.date)} · {b.staff} · {b.items.length} items · {(b.payment||"cash").toUpperCase()}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div className="bc-amt">{inr(b.grand)}</div>
                <span className={`tag tag-${b.status==="verified"?"grn":b.status==="cancelled"?"red":"ylw"}`}>{b.status}</span>
              </div>
            </div>
          ))
        }
      </div>
    ),

    /* ── CUSTOMERS ── */
    customers:(
      <div>
        <div className="page-hd" style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div><div className="page-title">👥 Customers</div><div className="page-sub">{customers.length} registered customers</div></div>
          <button className="btn btn-blue" onClick={()=>openModal("addCustomer")}>+ Add Customer</button>
        </div>

        <input className="inp" style={{marginBottom:12}} placeholder="Search by name or phone..." value={custFilter} onChange={e=>setCustFilter(e.target.value)}/>

        <div className="kpi-grid" style={{marginBottom:14}}>
          {[
            {lbl:"Total Customers", val:customers.length,                                          clr:"var(--blue)"},
            {lbl:"Platinum",        val:customers.filter(c=>c.tier==="platinum").length,            clr:"#E5E4E2"},
            {lbl:"Gold",            val:customers.filter(c=>c.tier==="gold").length,               clr:"#FFD700"},
            {lbl:"Total Revenue",   val:inr(customers.reduce((s,c)=>s+c.totalSpent,0)),            clr:"var(--grn)"},
          ].map((k,i)=>(
            <div key={i} className="kpi"><div className="kpi-lbl">{k.lbl}</div><div className="kpi-val" style={{color:k.clr}}>{k.val}</div></div>
          ))}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10}}>
          {customers.filter(c=>c.name.toLowerCase().includes(custFilter.toLowerCase())||c.phone.includes(custFilter)).map(c=>(
            <div key={c.id} className="panel" style={{margin:0,cursor:"pointer"}} onClick={()=>openModal("customer",c)}>
              <div className="ph">
                <div>
                  <div style={{fontWeight:700,fontSize:12}}>{c.name}</div>
                  <div style={{fontSize:9,color:"var(--t3)"}}>📞 {c.phone}</div>
                </div>
                <span className={`tier-badge tier-${c.tier}`}>{c.tier.toUpperCase()}</span>
              </div>
              <div className="pb" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,textAlign:"center"}}>
                {[
                  {lbl:"Spent",   val:inr(c.totalSpent), clr:"var(--ylw)"},
                  {lbl:"Bills",   val:c.bills,           clr:"var(--blue)"},
                  {lbl:"Points",  val:c.points,          clr:"var(--pur)"},
                ].map((m,i)=>(
                  <div key={i}><div style={{fontSize:12,fontWeight:700,color:m.clr}}>{m.val}</div><div style={{fontSize:9,color:"var(--t3)"}}>{m.lbl}</div></div>
                ))}
              </div>
              {/* loyalty progress */}
              <div style={{padding:"0 14px 10px"}}>
                <div style={{fontSize:9,color:"var(--t3)",marginBottom:3}}>
                  {c.tier==="platinum"?"Max tier achieved!":`${c.tier==="gold"?20000-c.totalSpent:c.tier==="silver"?10000-c.totalSpent:5000-c.totalSpent} to next tier`}
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{
                    width: c.tier==="platinum"?"100%":
                           c.tier==="gold"?`${Math.min(100,(c.totalSpent-10000)/10000*100)}%`:
                           c.tier==="silver"?`${Math.min(100,(c.totalSpent-5000)/5000*100)}%`:
                           `${Math.min(100,c.totalSpent/5000*100)}%`,
                    background: c.tier==="platinum"?"#E5E4E2":c.tier==="gold"?"#FFD700":c.tier==="silver"?"#C0C0C0":"#CD7F32"
                  }}/>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),

    /* ── INVENTORY ── */
    inventory:(
      <div>
        <div className="page-hd" style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div><div className="page-title">📦 Inventory</div><div className="page-sub">Stock levels & alerts</div></div>
          <button className="btn btn-blue" onClick={()=>openModal("addProduct")}>+ Add Product</button>
        </div>

        {lowStock.length>0&&(
          <div className="alert alert-red">🚨 Low stock: {lowStock.map(p=>p.name).join(", ")}</div>
        )}

        <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
          {["All",...[...new Set(products.map(p=>p.cat))]].map(cat=>(
            <button key={cat} className={`btn btn-sm ${prodFilter===cat?"btn-blue":"btn-ghost"}`} onClick={()=>setProdFilter(cat)}>{cat}</button>
          ))}
        </div>

        <div style={{overflowX:"auto"}}>
          <table className="tbl">
            <thead><tr><th>Product</th><th>Code</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {products.filter(p=>prodFilter==="All"||p.cat===prodFilter).map(p=>{
                const isLow = (p.stock||0)<=(p.minStock||0);
                return(
                  <tr key={p.id}>
                    <td style={{fontWeight:600}}>{p.name}</td>
                    <td style={{fontFamily:"monospace",fontSize:10,color:"var(--t3)"}}>{p.code}</td>
                    <td><span className="tag tag-blue">{p.cat}</span></td>
                    <td style={{color:"var(--ylw)",fontWeight:700}}>{inr(p.price)}</td>
                    <td>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <span style={{color:isLow?"var(--red)":"var(--grn)",fontWeight:700}}>{p.stock||0}</span>
                        <span style={{fontSize:9,color:"var(--t3)"}}>/ min {p.minStock||0}</span>
                      </div>
                    </td>
                    <td><span className={`tag ${isLow?"tag-red":"tag-grn"}`}>{isLow?"Low Stock":"In Stock"}</span></td>
                    <td>
                      <button className="btn btn-ghost btn-sm" style={{marginRight:4}} onClick={()=>openModal("editProduct",p)}>Edit</button>
                      <button className="btn btn-grn btn-sm" onClick={()=>{
                        setProducts(prev=>prev.map(x=>x.id===p.id?{...x,stock:(x.stock||0)+50}:x));
                        notify("✅ Restocked 50 units of "+p.name);
                      }}>+50</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    ),

    /* ── ANALYTICS ── */
    analytics:(
      <div>
        <div className="page-hd"><div className="page-title">📈 Analytics</div><div className="page-sub">Sales performance & insights</div></div>

        <div className="kpi-grid">
          {[
            {lbl:"Total Revenue",     val:inr(totalSales),                                                                               clr:"var(--grn)"},
            {lbl:"Total Bills",       val:bills.length,                                                                                  clr:"var(--blue)"},
            {lbl:"Avg Bill Value",    val:bills.length?inr(Math.round(totalSales/bills.length)):"₹0",                                    clr:"var(--ylw)"},
            {lbl:"Verified Bills",    val:bills.filter(b=>b.status==="verified").length,                                                 clr:"var(--grn)"},
            {lbl:"Total Discount",    val:inr(Math.round(bills.reduce((s,b)=>s+b.disc,0))),                                              clr:"var(--red)"},
            {lbl:"Total Tax",         val:inr(Math.round(bills.reduce((s,b)=>s+b.tax,0))),                                               clr:"var(--pur)"},
          ].map((k,i)=>(
            <div key={i} className="kpi"><div className="kpi-lbl">{k.lbl}</div><div className="kpi-val" style={{color:k.clr}}>{k.val}</div></div>
          ))}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {/* payment breakdown */}
          <div className="panel">
            <div className="ph"><span className="ph-title">💳 Payment Methods</span></div>
            <div className="pb">
              {["cash","upi","card","wallet","credit"].map(method=>{
                const cnt = bills.filter(b=>b.payment===method).length;
                const pct = bills.length ? Math.round(cnt/bills.length*100) : 0;
                return(
                  <div key={method} style={{marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3}}>
                      <span style={{fontWeight:600,textTransform:"uppercase"}}>{method}</span>
                      <span style={{color:"var(--t2)"}}>{cnt} bills ({pct}%)</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{width:pct+"%",background:"var(--blue)"}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* top products */}
          <div className="panel">
            <div className="ph"><span className="ph-title">🏆 Top Products</span></div>
            <div className="pb" style={{padding:0}}>
              {(()=>{
                const ps={};
                bills.forEach(b=>b.items.forEach(it=>{
                  ps[it.n]=(ps[it.n]||0)+(parseInt(it.q)||0)*(parseFloat(it.p)||0);
                }));
                return Object.entries(ps).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([name,rev],i)=>(
                  <div key={name} style={{padding:"8px 12px",borderBottom:"1px solid var(--b0)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{background:"var(--s3)",borderRadius:4,width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700}}>{i+1}</span>
                      <span style={{fontSize:11,fontWeight:600}}>{name}</span>
                    </div>
                    <span style={{color:"var(--ylw)",fontWeight:700,fontSize:12}}>{inr(rev)}</span>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>

        {/* staff performance */}
        <div className="panel">
          <div className="ph"><span className="ph-title">👤 Staff Sales Performance</span></div>
          <div style={{overflowX:"auto"}}>
            <table className="tbl">
              <thead><tr><th>Staff</th><th>Bills</th><th>Revenue</th><th>Avg Bill</th><th>Share</th></tr></thead>
              <tbody>
                {(()=>{
                  const sm={};
                  bills.forEach(b=>{ if(!sm[b.staff])sm[b.staff]={bills:0,rev:0}; sm[b.staff].bills++; sm[b.staff].rev+=b.grand; });
                  return Object.entries(sm).sort((a,b)=>b[1].rev-a[1].rev).map(([name,d])=>(
                    <tr key={name}>
                      <td style={{fontWeight:600}}>{name}</td>
                      <td>{d.bills}</td>
                      <td style={{color:"var(--ylw)",fontWeight:700}}>{inr(d.rev)}</td>
                      <td>{inr(Math.round(d.rev/d.bills))}</td>
                      <td>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <div className="progress-bar" style={{width:80,margin:0}}>
                            <div className="progress-fill" style={{width:`${Math.round(d.rev/totalSales*100)}%`,background:"var(--blue)"}}/>
                          </div>
                          <span style={{fontSize:9,color:"var(--t2)"}}>{Math.round(d.rev/totalSales*100)}%</span>
                        </div>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    ),

    /* ── STAFF ── */
    staff:(
      <div>
        <div className="page-hd" style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div><div className="page-title">👥 Staff</div><div className="page-sub">Manage team members</div></div>
          <button className="btn btn-blue" onClick={()=>openModal("addStaff")}>+ Add Staff</button>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:10}}>
          {staffList.map(s=>(
            <div key={s.id} className="panel" style={{margin:0}}>
              <div className="ph" style={{justifyContent:"flex-start",gap:10}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,var(--blue),var(--pur))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,flexShrink:0}}>{s.name[0]}</div>
                <div>
                  <div style={{fontWeight:700,fontSize:12}}>{s.name}</div>
                  <div style={{fontSize:9,color:"var(--t3)",textTransform:"capitalize"}}>{s.role}</div>
                </div>
                <span className={`tag ${s.active?"tag-grn":"tag-red"}`} style={{marginLeft:"auto"}}>{s.active?"Active":"Off"}</span>
              </div>
              <div className="pb" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,textAlign:"center"}}>
                {[
                  {lbl:"Bills",  val:s.bills,       clr:"var(--blue)"},
                  {lbl:"Sales",  val:inr(s.sales),  clr:"var(--ylw)"},
                ].map((m,i)=>(
                  <div key={i}><div style={{fontSize:14,fontWeight:700,color:m.clr}}>{m.val}</div><div style={{fontSize:9,color:"var(--t3)"}}>{m.lbl}</div></div>
                ))}
              </div>
              <div style={{padding:"0 14px 10px",display:"flex",gap:6,justifyContent:"flex-end"}}>
                <button className="btn btn-ghost btn-sm" onClick={()=>setStaffList(prev=>prev.map(x=>x.id===s.id?{...x,active:!x.active}:x))}>{s.active?"Deactivate":"Activate"}</button>
                <button className="btn btn-red btn-sm" onClick={()=>{ setStaffList(prev=>prev.filter(x=>x.id!==s.id)); notify("✅ Staff removed"); }}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),

    /* ── SETTINGS ── */
    settings:(
      <div style={{maxWidth:540}}>
        <div className="page-hd"><div className="page-title">⚙️ Settings</div></div>

        <div className="panel">
          <div className="ph"><span className="ph-title">🏪 Shop Details</span></div>
          <div className="pb">
            {[
              {lbl:"Shop Name",  val:shopName,  set:setShopName,  ph:"Your shop name"},
              {lbl:"Address",    val:shopAddr,  set:setShopAddr,  ph:"Shop address"},
              {lbl:"Phone",      val:shopPhone, set:setShopPhone, ph:"Contact number"},
            ].map(f=>(
              <div key={f.lbl} className="inp-grp">
                <label className="inp-lbl">{f.lbl}</label>
                <input className="inp" placeholder={f.ph} value={f.val} onChange={e=>f.set(e.target.value)}/>
              </div>
            ))}
            <button className="btn btn-grn" onClick={()=>notify("✅ Shop details saved!")}>Save Details</button>
          </div>
        </div>

        {user.role==="owner"&&(
          <div className="panel">
            <div className="ph"><span className="ph-title">🔐 Security</span></div>
            <div className="pb">
              <div style={{fontSize:11,marginBottom:12}}>Current PIN: <span style={{fontFamily:"monospace",color:"var(--blue)",fontSize:13,fontWeight:700}}>{ownerPin}</span></div>
              <div className="inp-grp">
                <label className="inp-lbl">New PIN (4-6 digits)</label>
                <input className="inp" type="password" placeholder="Enter new PIN" onChange={e=>{ const v=e.target.value.replace(/\D/g,"").slice(0,6); e.target.value=v; setOwnerPin(v||ownerPin); }}/>
              </div>
              <button className="btn btn-blue" onClick={()=>notify("✅ PIN updated!")}>Update PIN</button>
            </div>
          </div>
        )}

        <div className="panel">
          <div className="ph"><span className="ph-title">📊 Export Data</span></div>
          <div className="pb">
            <button className="btn btn-ghost" style={{marginRight:8}} onClick={()=>{
              const csv = ["ID,Date,Customer,Staff,Items,Subtotal,Discount,Tax,Grand,Status,Payment",
                ...bills.map(b=>`${b.id},${fmtD(b.date)},${b.custName},${b.staff},"${b.items.map(i=>i.n+"×"+i.q).join("; ")}",${b.sub},${b.disc},${b.tax},${b.grand},${b.status},${b.payment||""}`)
              ].join("\n");
              const a=document.createElement("a"); a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv); a.download="QuickBill_bills.csv"; a.click();
              notify("✅ Bills exported to CSV!");
            }}>📥 Export Bills CSV</button>
            <button className="btn btn-ghost" onClick={()=>{
              const csv = ["ID,Name,Phone,Tier,Spent,Bills,Points",
                ...customers.map(c=>`${c.id},${c.name},${c.phone},${c.tier},${c.totalSpent},${c.bills},${c.points}`)
              ].join("\n");
              const a=document.createElement("a"); a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv); a.download="QuickBill_customers.csv"; a.click();
              notify("✅ Customers exported!");
            }}>📥 Export Customers CSV</button>
          </div>
        </div>
      </div>
    ),
  };

  /* ── NAV ITEMS ── */
  const staffNav  = [["bill","🧾","New Bill"],["bills","📋","My Bills"],["inventory","📦","Products"],["settings","⚙️","Settings"]];
  const ownerNav  = [["dashboard","📊","Dashboard"],["bills","📋","All Bills"],["customers","👥","Customers"],["analytics","📈","Analytics"],["inventory","📦","Inventory"],["staff","👤","Staff"],["settings","⚙️","Settings"]];
  const navItems  = user.role==="owner" ? ownerNav : staffNav;

  const pageTitle = navItems.find(n=>n[0]===page)?.[2] || "QuickBill Pro";

  /* ── MODAL CONTENT ── */
  const renderModal = () => {
    if(!modal) return null;
    const {type,data} = modal;

    if(type==="bill") return(
      <div className="overlay" onClick={closeModal}>
        <div className="modal" onClick={e=>e.stopPropagation()}>
          <div className="mh"><div className="mh-title">Bill #{data.id}</div><button className="mclose" onClick={closeModal}>✕</button></div>
          <div className="mbody">
            <Receipt bill={data} shopName={shopName} shopPhone={shopPhone} shopAddr={shopAddr}/>
            <div style={{display:"flex",gap:8,marginTop:14,flexWrap:"wrap"}}>
              {data.status==="pending"&&<button className="btn btn-grn" onClick={()=>{ setBills(p=>p.map(b=>b.id===data.id?{...b,status:"verified"}:b)); notify("✅ Bill verified!"); closeModal(); }}>✅ Verify</button>}
              {data.status!=="cancelled"&&<button className="btn btn-red" onClick={()=>{ setBills(p=>p.map(b=>b.id===data.id?{...b,status:"cancelled"}:b)); notify("🚫 Bill cancelled"); closeModal(); }}>Cancel</button>}
              <button className="btn btn-ghost" onClick={()=>window.print()}>🖨️ Print</button>
              <button className="btn btn-ghost" onClick={()=>{ setBills(p=>p.filter(b=>b.id!==data.id)); notify("🗑️ Bill deleted"); closeModal(); }}>Delete</button>
            </div>
          </div>
        </div>
      </div>
    );

    if(type==="print") return(
      <div className="overlay" onClick={closeModal}>
        <div className="modal" onClick={e=>e.stopPropagation()}>
          <div className="mh"><div className="mh-title">🖨️ Print Preview</div><button className="mclose" onClick={closeModal}>✕</button></div>
          <div className="mbody">
            <Receipt bill={data} shopName={shopName} shopPhone={shopPhone} shopAddr={shopAddr}/>
            <button className="btn btn-blue" style={{width:"100%",marginTop:14,justifyContent:"center"}} onClick={()=>window.print()}>🖨️ Print Receipt</button>
          </div>
        </div>
      </div>
    );

    if(type==="customer") return(
      <div className="overlay" onClick={closeModal}>
        <div className="modal" onClick={e=>e.stopPropagation()}>
          <div className="mh">
            <div>
              <div className="mh-title">{data.name}</div>
              <span className={`tier-badge tier-${data.tier}`}>{data.tier.toUpperCase()}</span>
            </div>
            <button className="mclose" onClick={closeModal}>✕</button>
          </div>
          <div className="mbody">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16,textAlign:"center"}}>
              {[{lbl:"Total Spent",val:inr(data.totalSpent),clr:"var(--ylw)"},{lbl:"Bills",val:data.bills,clr:"var(--blue)"},{lbl:"Points",val:data.points,clr:"var(--pur)"}].map((m,i)=>(
                <div key={i} style={{background:"var(--s3)",borderRadius:"var(--r)",padding:10}}>
                  <div style={{fontSize:16,fontWeight:800,color:m.clr}}>{m.val}</div>
                  <div style={{fontSize:9,color:"var(--t3)",marginTop:3}}>{m.lbl}</div>
                </div>
              ))}
            </div>
            {[["📞 Phone",data.phone],["📧 Email",data.email],["📍 Address",data.address],["📅 Joined",fmtD(data.joined)]].map(([l,v])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid var(--b0)",fontSize:11}}>
                <span style={{color:"var(--t3)"}}>{l}</span><span style={{fontWeight:600}}>{v}</span>
              </div>
            ))}
            <div style={{marginTop:12}}>
              <div style={{fontSize:10,color:"var(--t2)",marginBottom:6}}>Loyalty Progress</div>
              <div className="progress-bar" style={{height:8}}>
                <div className="progress-fill" style={{
                  width: data.tier==="platinum"?"100%":data.tier==="gold"?`${Math.min(100,(data.totalSpent-10000)/10000*100)}%`:data.tier==="silver"?`${Math.min(100,(data.totalSpent-5000)/5000*100)}%`:`${Math.min(100,data.totalSpent/5000*100)}%`,
                  background: data.tier==="platinum"?"#E5E4E2":data.tier==="gold"?"#FFD700":data.tier==="silver"?"#C0C0C0":"#CD7F32"
                }}/>
              </div>
              <div style={{fontSize:9,color:"var(--t3)",marginTop:4}}>{data.tier==="platinum"?"You're at the highest tier! 🎉":`Spend ${inr(data.tier==="gold"?20000-data.totalSpent:data.tier==="silver"?10000-data.totalSpent:5000-data.totalSpent)} more to reach next tier`}</div>
            </div>
          </div>
        </div>
      </div>
    );

    if(type==="addCustomer"||type==="editCustomer"){
      const isEdit = type==="editCustomer";
      let f = isEdit ? {...data} : {name:"",phone:"",email:"",address:"",tier:"bronze"};
      return(
        <div className="overlay" onClick={closeModal}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="mh"><div className="mh-title">{isEdit?"Edit":"Add"} Customer</div><button className="mclose" onClick={closeModal}>✕</button></div>
            <div className="mbody">
              {[["Name *","name","text","Full name"],["Phone *","phone","tel","10-digit phone"],["Email","email","email","Email address"],["Address","address","text","City / Area"]].map(([lbl,key,type2,ph])=>(
                <div key={key} className="inp-grp">
                  <label className="inp-lbl">{lbl}</label>
                  <input className="inp" type={type2} placeholder={ph} defaultValue={f[key]} onChange={e=>f[key]=e.target.value}/>
                </div>
              ))}
              <button className="btn btn-grn" style={{width:"100%",marginTop:8,justifyContent:"center"}} onClick={()=>{
                if(!f.name||!f.phone){notify("⚠️ Name & phone required");return;}
                if(isEdit){
                  setCustomers(prev=>prev.map(c=>c.id===data.id?{...c,...f}:c));
                  notify("✅ Customer updated!");
                } else {
                  setCustomers(prev=>[...prev,{...f,id:"c"+uid(),totalSpent:0,bills:0,points:0,joined:new Date()}]);
                  notify("✅ Customer added!");
                }
                closeModal();
              }}>✅ {isEdit?"Update":"Add"} Customer</button>
            </div>
          </div>
        </div>
      );
    }

    if(type==="addProduct"||type==="editProduct"){
      const isEdit = type==="editProduct";
      let f = isEdit ? {...data} : {name:"",price:"",unit:"pcs",cat:"General",code:"",stock:"50",minStock:"10"};
      return(
        <div className="overlay" onClick={closeModal}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="mh"><div className="mh-title">{isEdit?"Edit":"Add"} Product</div><button className="mclose" onClick={closeModal}>✕</button></div>
            <div className="mbody">
              <div className="inp-grp"><label className="inp-lbl">Product Name *</label><input className="inp" placeholder="e.g. Rice 5kg" defaultValue={f.name} onChange={e=>f.name=e.target.value}/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div className="inp-grp"><label className="inp-lbl">Price ₹ *</label><input className="inp" type="number" placeholder="0" defaultValue={f.price} onChange={e=>f.price=e.target.value}/></div>
                <div className="inp-grp"><label className="inp-lbl">Unit</label><input className="inp" placeholder="kg, pcs, L..." defaultValue={f.unit} onChange={e=>f.unit=e.target.value}/></div>
              </div>
              <div className="inp-grp"><label className="inp-lbl">Barcode (Optional)</label><input className="inp" placeholder="EAN-13 barcode" defaultValue={f.code} onChange={e=>f.code=e.target.value}/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div className="inp-grp"><label className="inp-lbl">Stock Qty</label><input className="inp" type="number" placeholder="0" defaultValue={f.stock} onChange={e=>f.stock=parseInt(e.target.value)||0}/></div>
                <div className="inp-grp"><label className="inp-lbl">Min Stock</label><input className="inp" type="number" placeholder="0" defaultValue={f.minStock} onChange={e=>f.minStock=parseInt(e.target.value)||0}/></div>
              </div>
              <div className="inp-grp"><label className="inp-lbl">Category</label>
                <select className="inp" defaultValue={f.cat} onChange={e=>f.cat=e.target.value} style={{cursor:"pointer"}}>
                  {["Grains","Dairy","Cooking","Spices","Snacks","Beverages","Personal","General"].map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <button className="btn btn-grn" style={{width:"100%",marginTop:8,justifyContent:"center"}} onClick={()=>{
                if(!f.name||!f.price){notify("⚠️ Name & price required");return;}
                if(isEdit){
                  setProducts(prev=>prev.map(p=>p.id===data.id?{...p,...f,price:parseFloat(f.price)||0}:p));
                  notify("✅ Product updated!");
                } else {
                  setProducts(prev=>[...prev,{...f,id:"p"+uid(),price:parseFloat(f.price)||0}]);
                  notify("✅ Product added!");
                }
                closeModal();
              }}>✅ {isEdit?"Update":"Save"} Product</button>
            </div>
          </div>
        </div>
      );
    }

    if(type==="addStaff"){
      let f={name:"",role:"cashier",pin:"1111"};
      return(
        <div className="overlay" onClick={closeModal}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="mh"><div className="mh-title">Add Staff Member</div><button className="mclose" onClick={closeModal}>✕</button></div>
            <div className="mbody">
              <div className="inp-grp"><label className="inp-lbl">Name *</label><input className="inp" placeholder="Staff name" onChange={e=>f.name=e.target.value}/></div>
              <div className="inp-grp"><label className="inp-lbl">Role</label>
                <select className="inp" onChange={e=>f.role=e.target.value} style={{cursor:"pointer"}}>
                  {["cashier","manager","supervisor","assistant"].map(r=><option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="inp-grp"><label className="inp-lbl">PIN</label><input className="inp" placeholder="4-digit PIN" onChange={e=>f.pin=e.target.value.replace(/\D/g,"").slice(0,4)}/></div>
              <button className="btn btn-grn" style={{width:"100%",marginTop:8,justifyContent:"center"}} onClick={()=>{
                if(!f.name){notify("⚠️ Name required");return;}
                setStaffList(prev=>[...prev,{...f,id:"s"+uid(),bills:0,sales:0,joined:new Date(),active:true}]);
                notify("✅ Staff added!");
                closeModal();
              }}>✅ Add Staff</button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  /* ─── RENDER ─── */
  return(
    <>
      <style>{CSS}</style>
      <div className="shell">
        {/* sidebar */}
        <div className={`sb ${sbOpen?"open":""}`}>
          <div className="sb-logo" onClick={()=>nav("dashboard")}>Quick<em>Bill</em> <span style={{fontSize:11,color:"var(--t3)",fontFamily:"inherit",fontWeight:400}}>v2</span></div>
          <div className="sb-user">
            <div className="sb-av">{user.name[0].toUpperCase()}</div>
            <div>
              <div style={{fontSize:11,fontWeight:700}}>{user.name}</div>
              <div style={{fontSize:9,color:"var(--t3)",textTransform:"capitalize"}}>{user.role}</div>
            </div>
          </div>
          <div className="sb-nav">
            {navItems.map(([key,ico,lbl])=>(
              <div key={key} className={`sb-item ${page===key?"on":""}`} onClick={()=>nav(key)}>
                <span style={{fontSize:14}}>{ico}</span>
                <span className="sb-lbl">{lbl}</span>
                {key==="bills"&&pendingBills.length>0&&<span className="sb-badge">{pendingBills.length}</span>}
                {key==="inventory"&&lowStock.length>0&&<span className="sb-badge">{lowStock.length}</span>}
              </div>
            ))}
          </div>
          <div className="sb-out" onClick={()=>{ setUser(null); setPage("dashboard"); }}>🚪 Sign Out</div>
        </div>

        {/* main */}
        <div className="main">
          <div className="topbar">
            <div className="tb-left">
              <button className="menu-btn" onClick={()=>setSbOpen(!sbOpen)}>☰</button>
              <div className="tb-title">{pageTitle}</div>
            </div>
            <div className="tb-right">
              <span>🕐 {fmtT(new Date())} · {fmtD(new Date())}</span>
              {pendingBills.length>0&&<span style={{color:"var(--ylw)"}}>⏳ {pendingBills.length} pending</span>}
            </div>
          </div>

          <div className="content">
            {pages[page] || <div style={{padding:40,textAlign:"center",color:"var(--t3)"}}>Page not found</div>}
          </div>
        </div>
      </div>

      {/* modals */}
      {renderModal()}

      {/* toast */}
      {toast&&<div className="toast">{toast}</div>}
    </>
  );
}
