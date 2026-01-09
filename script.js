// ================= UTIL =================
const charToNum = c => c.toUpperCase().charCodeAt(0) - 64;
const numToChar = n => String.fromCharCode(((n - 1 + 26) % 26) + 65);
const gcd = (a,b)=>b?gcd(b,a%b):a;

// ================= UI ENHANCEMENT =================
function toast(msg, type="info"){
  const t=document.createElement("div");
  t.className=`toast ${type}`;
  t.innerText=msg;
  document.body.appendChild(t);
  setTimeout(()=>t.classList.add("show"),10);
  setTimeout(()=>{
    t.classList.remove("show");
    setTimeout(()=>t.remove(),300);
  },2500);
}

function loading(state=true){
  let l=document.getElementById("loader");
  if(!l){
    l=document.createElement("div");
    l.id="loader";
    l.innerHTML="<div class='spin'></div><p>Memproses...</p>";
    document.body.appendChild(l);
  }
  l.style.display=state?"flex":"none";
}

// ================= CAESAR =================
function caesar(text, key, mode){
  key=parseInt(key);
  if(isNaN(key)) return "❌ Key harus angka";
  return [...text].map(c=>{
    if(!/[a-z]/i.test(c)) return c;
    let n=charToNum(c)+(mode==="encrypt"?key:-key);
    let r=numToChar(n);
    return c===c.toLowerCase()?r.toLowerCase():r;
  }).join("");
}

// ================= VIGENERE =================
function vigenere(text,key,mode){
  if(!key) return "❌ Keyword kosong";
  key=key.replace(/\s/g,"");
  let j=0;
  return [...text].map(c=>{
    if(!/[a-z]/i.test(c)) return c;
    let t=charToNum(c);
    let k=charToNum(key[j++%key.length]);
    let n=t+(mode==="encrypt"?k:-k);
    let r=numToChar(n);
    return c===c.toLowerCase()?r.toLowerCase():r;
  }).join("");
}

// ================= HILL =================
function hill(text,m,mode){
  let det=(m[0]*m[3]-m[1]*m[2])%26;
  let inv=[...Array(26).keys()].find(i=>(det*i)%26===1);
  if(inv===undefined) return "❌ Matriks tidak invertible";

  if(mode==="decrypt"){
    m=[m[3]*inv,-m[1]*inv,-m[2]*inv,m[0]*inv]
      .map(x=>((x%26)+26)%26);
  }

  let buf=[],res="";
  for(let c of text){
    if(/[a-z]/i.test(c)){
      buf.push(charToNum(c));
      if(buf.length===2){
        res+=numToChar(m[0]*buf[0]+m[1]*buf[1]);
        res+=numToChar(m[2]*buf[0]+m[3]*buf[1]);
        buf=[];
      }
    } else res+=c;
  }
  return res;
}

// ================= RSA =================
function rsaKeys(p,q){
  if(!p||!q) return {};
  let n=p*q,phi=(p-1)*(q-1),e=2;
  while(gcd(e,phi)!==1) e++;
  let d=[...Array(phi).keys()].find(x=>(e*x)%phi===1);
  return {e,d,n};
}
function rsaEncrypt(t,e,n){
  return [...t].map(c=>/[a-z]/i.test(c)?Math.pow(charToNum(c),e)%n:c).join(" ");
}
function rsaDecrypt(t,d,n){
  return t.split(" ").map(c=>isNaN(c)?c:numToChar(Math.pow(+c,d)%n)).join("");
}

// ================= AES =================
const aesEncrypt=(t,k)=>CryptoJS.AES.encrypt(t,k).toString();
const aesDecrypt=(t,k)=>CryptoJS.AES.decrypt(t,k).toString(CryptoJS.enc.Utf8);

// ================= FILE =================
fileInput.addEventListener("change",()=>{
  const file=fileInput.files[0];
  if(!file) return;
  const reader=new FileReader();
  reader.onload=e=>{
    inputText.value=e.target.result;
    toast("File berhasil dimuat","success");
  };
  reader.readAsText(file);
});

// ================= UI =================
function setInfo(txt){
  infoBox.innerHTML="<b>📘 Penjelasan Kunci</b><br>"+txt;
}

function showInputs(){
  keyBox.innerHTML="";
  fileInput.hidden=true;
  inputText.readOnly=false;
  inputText.value="";

  let m=method.value;

  if(m==="Caesar"){
    keyBox.innerHTML=`<input id="key" placeholder="Shift">`;
    setInfo("Shift angka 1–25");
  }
  else if(m==="Vigenere"){
    keyBox.innerHTML=`<input id="key" placeholder="Keyword">`;
    setInfo("Keyword huruf A–Z");
  }
  else if(m==="Hill"){
    keyBox.innerHTML=`<input id="a" placeholder="a"><input id="b" placeholder="b"><br><input id="c" placeholder="c"><input id="d" placeholder="d">`;
    setInfo("Hill Cipher matriks 2×2");
  }
  else if(m.startsWith("RSA")){
    keyBox.innerHTML=`<input id="p" placeholder="p"><input id="q" placeholder="q">`;
    setInfo("p dan q bilangan prima");
    if(m.includes("Dokumen")){
      fileInput.hidden=false;
      inputText.readOnly=true;
    }
  }
  else if(m.startsWith("AES")){
    keyBox.innerHTML=`<input id="key" placeholder="16 karakter">`;
    setInfo("AES Key 16 karakter");
    if(m.includes("Dokumen")){
      fileInput.hidden=false;
      inputText.readOnly=true;
    }
  }
}

// ================= PROCESS =================
function process(mode){
  loading(true);
  setTimeout(()=>{
    let t=inputText.value,m=method.value,o="";
    if(!t){ loading(false); toast("Input kosong","error"); return; }

    if(m==="Caesar") o=caesar(t,key.value,mode);
    else if(m==="Vigenere") o=vigenere(t,key.value,mode);
    else if(m==="Hill") o=hill(t,[+a.value,+b.value,+c.value,+d.value],mode);
    else if(m.startsWith("RSA")){
      let {e,d,n}=rsaKeys(+p.value,+q.value);
      o=mode==="encrypt"?rsaEncrypt(t,e,n):rsaDecrypt(t,d,n);
    }
    else if(m.startsWith("AES")){
      o=mode==="encrypt"?aesEncrypt(t,key.value):aesDecrypt(t,key.value);
    }

    outputText.value=o;
    loading(false);
    toast(mode==="encrypt"?"Enkripsi berhasil":"Dekripsi berhasil","success");
  },400);
}

// ================= DOWNLOAD =================
function downloadResult(){
  if(!outputText.value) return toast("Tidak ada hasil","error");
  let blob=new Blob([outputText.value]);
  let a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="hasil.txt";
  a.click();
  toast("File berhasil diunduh","success");
}

showInputs();

// ================= STYLE INJECT =================
const style=document.createElement("style");
style.innerHTML=`
.toast{position:fixed;top:20px;right:-300px;padding:12px 18px;border-radius:12px;color:#fff;font-size:.85rem;box-shadow:0 6px 20px rgba(0,0,0,.2);transition:.3s;z-index:9999}
.toast.show{right:20px}
.toast.success{background:#4caf50}
.toast.error{background:#e53935}
#loader{display:none;position:fixed;inset:0;background:rgba(0,0,0,.4);align-items:center;justify-content:center;flex-direction:column;color:#fff;z-index:9998}
.spin{width:45px;height:45px;border:4px solid #fff;border-top:4px solid transparent;border-radius:50%;animation:spin 1s linear infinite;margin-bottom:10px}
@keyframes spin{to{transform:rotate(360deg)}}
`;
document.head.appendChild(style);
