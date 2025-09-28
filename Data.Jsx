import React, { useEffect, useState } from "react";

// Simple single-file React app that stores contacts in localStorage. // - Anyone can add/view contacts (name + WA number) // - Only the owner (created on first setup) can delete contacts // - Owner is created on first-run by setting owner name + password // Security note: this is for small/private use/demo. For production use, move to a server-side backend, use HTTPS and proper authentication.

async function hashPassword(password) { const enc = new TextEncoder(); const data = enc.encode(password); const hashBuffer = await crypto.subtle.digest("SHA-256", data); const hashArray = Array.from(new Uint8Array(hashBuffer)); return hashArray.map(b => b.toString(16).padStart(2, "0")).join(""); }

const STORAGE_KEYS = { CONTACTS: "wa_contacts_v1", OWNER: "wa_owner_v1", };

function loadContacts() { try { const raw = localStorage.getItem(STORAGE_KEYS.CONTACTS); return raw ? JSON.parse(raw) : []; } catch (e) { return []; } }

function saveContacts(list) { localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(list)); }

function loadOwner() { try { const raw = localStorage.getItem(STORAGE_KEYS.OWNER); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }

function saveOwner(ownerObj) { localStorage.setItem(STORAGE_KEYS.OWNER, JSON.stringify(ownerObj)); }

export default function App() { const [contacts, setContacts] = useState([]); const [owner, setOwner] = useState(null); const [loggedIn, setLoggedIn] = useState(false);

// form fields const [name, setName] = useState(""); const [wa, setWa] = useState("");

// owner setup / login fields const [ownerNameInput, setOwnerNameInput] = useState(""); const [ownerPassInput, setOwnerPassInput] = useState(""); const [ownerPassConfirm, setOwnerPassConfirm] = useState(""); const [loginPass, setLoginPass] = useState("");

useEffect(() => { setContacts(loadContacts()); setOwner(loadOwner()); }, []);

async function handleCreateOwner(e) { e.preventDefault(); if (!ownerNameInput.trim()) return alert("Masukkan nama owner."); if (ownerPassInput.length < 4) return alert("Password minimal 4 karakter untuk demo."); if (ownerPassInput !== ownerPassConfirm) return alert("Password konfirmasi tidak cocok.");

const hashed = await hashPassword(ownerPassInput);
const ownerObj = {
  name: ownerNameInput.trim(),
  passHash: hashed,
  createdAt: new Date().toISOString(),
};
saveOwner(ownerObj);
setOwner(ownerObj);
setOwnerNameInput("");
setOwnerPassInput("");
setOwnerPassConfirm("");
alert(`Owner terdaftar: ${ownerObj.name}. Ingat password untuk menghapus data.`);

}

async function handleLogin(e) { e.preventDefault(); if (!owner) return alert("Belum ada owner, silakan buat owner terlebih dahulu."); const hashed = await hashPassword(loginPass); if (hashed === owner.passHash) { setLoggedIn(true); setLoginPass(""); alert(Login sebagai owner: ${owner.name}); } else { alert("Password salah."); } }

function handleLogout() { setLoggedIn(false); }

function validatePhone(p) { // Simple phone validation: digits, spaces, +, - allowed const cleaned = p.replace(/[\s()-]/g, ""); return /^[+0-9]{6,20}$/.test(cleaned); }

function handleAddContact(e) { e.preventDefault(); if (!name.trim()) return alert("Masukkan nama."); if (!wa.trim()) return alert("Masukkan nomor WA."); if (!validatePhone(wa.trim())) return alert("Format nomor WA tidak valid. Contoh: +6281234567 atau 081234567.");

const newContact = {
  id: Date.now().toString(),
  name: name.trim(),
  wa: wa.trim(),
  addedAt: new Date().toISOString(),
};
const updated = [newContact, ...contacts];
setContacts(updated);
saveContacts(updated);
setName("");
setWa("");

}

function handleDelete(id) { if (!loggedIn) return alert("Hanya owner yang bisa menghapus."); if (!confirm("Hapus data ini?")) return; const updated = contacts.filter(c => c.id !== id); setContacts(updated); saveContacts(updated); }

function handleExport() { const blob = new Blob([JSON.stringify(contacts, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = contacts_${new Date().toISOString().slice(0,10)}.json; a.click(); URL.revokeObjectURL(url); }

function handleClearAll() { if (!loggedIn) return alert("Hanya owner yang bisa menghapus semua data."); if (!confirm("Hapus SEMUA kontak? Tindakan ini tidak bisa dibatalkan.")) return; setContacts([]); saveContacts([]); }

return ( <div className="min-h-screen bg-gray-50 flex items-start justify-center p-6"> <div className="w-full max-w-3xl bg-white shadow-md rounded-2xl p-6"> <header className="mb-4"> <h1 className="text-2xl font-semibold">Data Nama & Nomor WA</h1> <p className="text-sm text-gray-600">Siapa saja bisa menambahkan dan melihat. Hanya owner yang bisa menghapus.</p> {owner && ( <div className="mt-2 text-sm text-gray-700">Owner: <strong>{owner.name}</strong>{loggedIn && <span> (logged in)</span>}</div> )} </header>

<main className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <section className="p-4 border rounded-lg">
        <h2 className="font-medium mb-2">Tambah Kontak</h2>
        <form onSubmit={handleAddContact}>
          <label className="block text-sm">Nama</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded mt-1 mb-2" />
          <label className="block text-sm">Nomor WA</label>
          <input value={wa} onChange={e => setWa(e.target.value)} className="w-full p-2 border rounded mt-1 mb-3" placeholder="Contoh: +6281234... atau 081234..." />
          <button className="px-4 py-2 rounded bg-blue-600 text-white">Tambah</button>
        </form>

        <div className="mt-4">
          <h3 className="font-medium">Ekspor</h3>
          <p className="text-sm text-gray-600">Unduh data sebagai JSON.</p>
          <div className="mt-2 flex gap-2">
            <button onClick={handleExport} className="px-3 py-1 border rounded">Export JSON</button>
            {loggedIn && <button onClick={handleClearAll} className="px-3 py-1 border rounded">Hapus Semua</button>}
          </div>
        </div>
      </section>

      <section className="p-4 border rounded-lg">
        <h2 className="font-medium mb-2">Kontak Tersimpan</h2>
        {contacts.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada kontak.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-auto">
            {contacts.map(c => (
              <div key={c.id} className="p-2 border rounded flex justify-between items-center">
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-sm text-gray-600">{c.wa}</div>
                </div>
                <div className="flex items-center gap-2">
                  <a className="text-sm underline" href={`https://wa.me/${c.wa.replace(/[^0-9+]/g, "")}`} target="_blank" rel="noreferrer">Chat</a>
                  {loggedIn && <button onClick={() => handleDelete(c.id)} className="px-2 py-1 border rounded">Hapus</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="md:col-span-2 p-4 border rounded-lg">
        {!owner ? (
          <div>
            <h2 className="font-medium mb-2">Buat Owner (hanya 1 kali)</h2>
            <p className="text-sm text-gray-600 mb-3">Sebelum bisa menghapus data, buat akun owner. Simpan password dengan baik.</p>
            <form onSubmit={handleCreateOwner} className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input value={ownerNameInput} onChange={e => setOwnerNameInput(e.target.value)} placeholder="Nama owner" className="p-2 border rounded col-span-1" />
              <input value={ownerPassInput} onChange={e => setOwnerPassInput(e.target.value)} placeholder="Password" type="password" className="p-2 border rounded col-span-1" />
              <input value={ownerPassConfirm} onChange={e => setOwnerPassConfirm(e.target.value)} placeholder="Konfirmasi password" type="password" className="p-2 border rounded col-span-1" />
              <div className="col-span-3 mt-2">
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Buat Owner</button>
              </div>
            </form>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
            <div>
              <h3 className="font-medium">Login Owner</h3>
              <p className="text-sm text-gray-600">Masukkan password untuk mengelola (hapus) data.</p>
            </div>
            {!loggedIn ? (
              <form onSubmit={handleLogin} className="flex gap-2 items-center col-span-2">
                <input value={loginPass} onChange={e => setLoginPass(e.target.value)} placeholder="Password owner" type="password" className="p-2 border rounded flex-1" />
                <button className="px-3 py-2 rounded bg-blue-600 text-white">Login</button>
              </form>
            ) : (
              <div className="col-span-2 flex gap-2 items-center">
                <div>Anda login sebagai <strong>{owner.name}</strong></div>
                <button onClick={handleLogout} className="px-3 py-1 border rounded">Logout</button>
              </div>
            )}
          </div>
        )}
      </section>

      <footer className="md:col-span-2 text-xs text-gray-500 mt-2">Catatan: Aplikasi ini menyimpan data di browser (localStorage). Untuk multi-user nyata dan data persisten di server, butuh backend (Node/Express + database) dan autentikasi server-side.</footer>
    </main>
  </div>
</div>

); }

