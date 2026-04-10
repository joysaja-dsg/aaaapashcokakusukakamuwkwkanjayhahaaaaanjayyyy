const firebaseConfig = {
  apiKey: "AIzaSyB69n2i0ojbX_8rUkk_TkLCJArK267v9C8",
  authDomain: "joywardana-22a02.firebaseapp.com",
  projectId: "joywardana-22a02",
  storageBucket: "joywardana-22a02.firebasestorage.app",
  messagingSenderId: "419983544601",
  appId: "1:419983544601:web:6e464a83252a9404373588",
};

firebase.initializeApp(firebaseConfig);

const auth=firebase.auth();
const db=firebase.firestore();
const storage=firebase.storage();

const ADMIN="rafiajawe3@gmail.com";

let currentUser=null;
let currentCategory="all";

/* AUTH */
auth.onAuthStateChanged(user=>{
  currentUser=user;

  if(user && user.email===ADMIN){
    adminPanel.classList.remove("hidden");
  }

  loadImages();
  loadSetting();
});

/* LOGIN */
function login(){
  auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
}
function logout(){auth.signOut();}

/* CATEGORY */
function setCategory(cat){
  currentCategory=cat;
  loadImages();
}

/* UPLOAD */
async function upload(){
  let f=file.files[0];
  let ref=storage.ref("img/"+Date.now());
  await ref.put(f);
  let url=await ref.getDownloadURL();

  db.collection("images").add({
    url,
    title:title.value,
    link:link.value||"",
    category:category.value||"random"
  });
}

/* LOAD IMAGE */
function loadImages(){
  db.collection("images").onSnapshot(snap=>{
    gallery.innerHTML="";
    snap.forEach(doc=>{
      let d=doc.data();

      if(currentCategory!=="all" && d.category!==currentCategory) return;

      let q=search.value.toLowerCase();
      if(q && !d.title.toLowerCase().includes(q)) return;

      gallery.innerHTML+=`
      <div class="card">
        <img src="${d.url}" onclick="openImg('${doc.id}','${d.url}','${d.link}')">
        <div class="overlay">${d.title}</div>
      </div>`;
    });
  });
}

/* POPUP */
function openImg(id,url,link){
  popup.classList.remove("hidden");
  popImg.src=url;

  popImg.onclick=()=>{
    if(link) window.open(link);
  };

  actionBox.innerHTML=`
    <button onclick="likeImage('${id}')">❤️</button>
    <button onclick="favImage('${id}')">⭐</button>
    <button onclick="sendComment('${id}')">💬</button>
  `;

  loadComments(id);
}

function closePopup(){
  popup.classList.add("hidden");
}

/* LIKE */
async function likeImage(id){
  if(!currentUser) return alert("Login dulu");

  let ref=db.collection("likes").doc(currentUser.uid+"_"+id);
  let doc=await ref.get();

  if(doc.exists){
    await ref.delete();
  }else{
    await ref.set({uid:currentUser.uid,image:id});
  }
}

/* FAVORITE */
async function favImage(id){
  if(!currentUser) return alert("Login dulu");

  let ref=db.collection("favorites").doc(currentUser.uid+"_"+id);
  let doc=await ref.get();

  if(doc.exists){
    await ref.delete();
  }else{
    await ref.set({uid:currentUser.uid,image:id});
  }
}

/* COMMENT */
async function sendComment(id){
  let text=prompt("Komentar:");
  if(!text) return;

  db.collection("comments").add({
    image:id,
    text,
    user:currentUser.email,
    time:Date.now()
  });

  loadComments(id);
}

async function loadComments(id){
  commentBox.innerHTML="";

  let snap=await db.collection("comments")
    .where("image","==",id)
    .get();

  snap.forEach(doc=>{
    let d=doc.data();
    commentBox.innerHTML+=`
      <div>
        <b>${d.user}</b><br>${d.text}
      </div>
    `;
  });
}

/* BG */
async function uploadBG(){
  let f=bgFile.files[0];
  let ref=storage.ref("bg");
  await ref.put(f);
  let url=await ref.getDownloadURL();

  db.collection("settings").doc("main").set({bg:url},{merge:true});
}

/* LOGO */
async function uploadLogo(){
  let f=logoFile.files[0];
  let ref=storage.ref("logo");
  await ref.put(f);
  let url=await ref.getDownloadURL();

  db.collection("settings").doc("main").set({logo:url},{merge:true});
}

/* SOCIAL */
function saveSocial(){
  db.collection("settings").doc("main").set({
    yt:ytLink.value,
    dc:dcLink.value,
    sp:spLink.value
  },{merge:true});
}

/* LOAD SETTING */
async function loadSetting(){
  let doc=await db.collection("settings").doc("main").get();
  let d=doc.data()||{};

  if(d.bg) document.body.style.background=`url(${d.bg})`;

  yt.onclick=()=>window.open(d.yt||"#");
  dc.onclick=()=>window.open(d.dc||"#");
  sp.onclick=()=>window.open(d.sp||"#");
}