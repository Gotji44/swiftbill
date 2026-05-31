/* ===================== Authentication Modal ===================== */
// แปลง username → อีเมลปลอมภายใน (Supabase ต้องการรูปแบบอีเมล แต่ผู้ใช้พิมพ์แค่ชื่อ)
const USER_EMAIL_DOMAIN = 'swiftbill.app';
const usernameToEmail = (u) => {
  const slug = (u||'').trim().toLowerCase().replace(/\s+/g,'').replace(/[^a-z0-9._-]/g,'');
  return slug ? `${slug}@${USER_EMAIL_DOMAIN}` : '';
};

function AuthModal({ onSuccess }){
  const [mode,setMode] = useState('signin'); // signin | signup
  const [username,setUsername] = useState('');
  const [password,setPassword] = useState('');
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const loginEmail = usernameToEmail(username);
      if(!loginEmail){
        throw new Error('ชื่อผู้ใช้ให้ใช้ตัวอักษรอังกฤษหรือตัวเลข เช่น abc, user01');
      }

      if(mode==='signup'){
        const { data, error: err } = await window.supabase.auth.signUp({
          email: loginEmail,
          password,
          options: { data: { username: username.trim(), company_name: username.trim() } }
        });
        if(err) throw err;

        // ถ้า "Confirm email" ถูกปิดใน Supabase → signUp คืน session มาเลย เข้าใช้งานทันที
        if(data.session){ onSuccess(data.user); return; }

        // เผื่อ signUp ไม่คืน session ให้ลองเข้าระบบต่อทันที
        const { data: si, error: e2 } = await window.supabase.auth.signInWithPassword({ email: loginEmail, password });
        if(e2){
          throw new Error('สมัครสำเร็จ แต่เข้าระบบอัตโนมัติไม่ได้ — กรุณาปิด "Confirm email" ใน Supabase แล้วลองใหม่');
        }
        onSuccess(si.user);
      } else {
        const { data, error: err } = await window.supabase.auth.signInWithPassword({ email: loginEmail, password });
        if(err){
          // แปลข้อความ error ที่พบบ่อยให้เป็นภาษาคน
          if(/invalid login credentials/i.test(err.message)) throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
          throw err;
        }
        onSuccess(data.user);
      }
    } catch(err){
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{position:'fixed',inset:0,background:'#eef1f6',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
      <div className="card" style={{maxWidth:380,width:'100%',padding:'36px 32px'}}>

        {/* Logo */}
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:24}}>
          <div style={{width:38,height:38,borderRadius:10,background:'var(--primary)',display:'flex',alignItems:'center',
            justifyContent:'center',color:'#fff',fontWeight:800,fontSize:16,fontFamily:'monospace'}}>SB</div>
          <span style={{fontWeight:700,fontSize:18}}>SwiftBill</span>
        </div>

        <h2 style={{fontSize:19,fontWeight:700,marginBottom:4}}>
          {mode==='signin' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
        </h2>
        <p style={{fontSize:13,color:'var(--ink-3)',marginBottom:22}}>
          {mode==='signin' ? 'ใช้บัญชี SwiftBill ของคุณ' : 'สร้างบัญชี SwiftBill ใหม่ ฟรี'}
        </p>

        <form onSubmit={handleAuth} style={{display:'flex',flexDirection:'column',gap:14}}>
          <div>
            <label style={{fontSize:12.5,fontWeight:600,display:'block',marginBottom:6,color:'var(--ink-2)'}}>ชื่อผู้ใช้</label>
            <input
              type="text"
              value={username}
              onChange={e=>setUsername(e.target.value)}
              placeholder="เช่น abc, user01"
              autoCapitalize="none"
              autoCorrect="off"
              required
              style={{width:'100%',padding:'10px 12px',border:'1px solid var(--border)',borderRadius:7,fontSize:14,
                fontFamily:'IBM Plex Sans Thai, sans-serif',outline:'none',boxSizing:'border-box',
                transition:'border-color .15s'}}
              onFocus={e=>e.target.style.borderColor='var(--primary)'}
              onBlur={e=>e.target.style.borderColor='var(--border)'}
            />
          </div>
          <div>
            <label style={{fontSize:12.5,fontWeight:600,display:'block',marginBottom:6,color:'var(--ink-2)'}}>รหัสผ่าน</label>
            <input
              type="password"
              value={password}
              onChange={e=>setPassword(e.target.value)}
              placeholder="รหัสผ่านของคุณ"
              required
              minLength={4}
              style={{width:'100%',padding:'10px 12px',border:'1px solid var(--border)',borderRadius:7,fontSize:14,
                fontFamily:'IBM Plex Sans Thai, sans-serif',outline:'none',boxSizing:'border-box',
                transition:'border-color .15s'}}
              onFocus={e=>e.target.style.borderColor='var(--primary)'}
              onBlur={e=>e.target.style.borderColor='var(--border)'}
            />
          </div>

          {error && (
            <div style={{fontSize:13,color:'#dc2626',background:'#fef2f2',padding:'10px 12px',borderRadius:7,
              border:'1px solid #fecaca'}}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{width:'100%',marginTop:4,justifyContent:'center'}}
          >
            {loading && <span className="spin" style={{display:'inline-block',width:15,height:15,marginRight:8,verticalAlign:'middle'}}></span>}
            {mode==='signin' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
          </button>
        </form>

        <div style={{textAlign:'center',marginTop:18,fontSize:13,color:'var(--ink-3)'}}>
          {mode==='signin' ? (
            <>ยังไม่มีบัญชี? {' '}
              <button style={{padding:'0 2px',color:'var(--primary)',fontWeight:600,cursor:'pointer',
                background:'none',border:'none',fontSize:13,fontFamily:'IBM Plex Sans Thai, sans-serif'}}
                onClick={()=>{ setMode('signup'); setError(''); }}>สมัครสมาชิกฟรี</button>
            </>
          ) : (
            <>มีบัญชีแล้ว? {' '}
              <button style={{padding:'0 2px',color:'var(--primary)',fontWeight:600,cursor:'pointer',
                background:'none',border:'none',fontSize:13,fontFamily:'IBM Plex Sans Thai, sans-serif'}}
                onClick={()=>{ setMode('signin'); setError(''); }}>เข้าสู่ระบบ</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
window.AuthModal = AuthModal;
