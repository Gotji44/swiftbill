/* ===================== Supabase Client ===================== */
const SUPABASE_URL = 'https://zokzcjbvjcxfjpcjsegx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_nL-wFMwEzKss2HZOylspIA_9ypFMEWv';
// storageKey ตรงกับ default ของ supabase-js (sb-<ref>-auth-token) → ตั้งเองเพื่ออ่าน token
// จาก localStorage ได้โดยตรงเวลา getSession() ค้าง (auth-lock)
const SB_STORAGE_KEY = 'sb-zokzcjbvjcxfjpcjsegx-auth-token';

// Initialize Supabase client
// ‼️ ปิด navigator LockManager (lock no-op) — บั๊ก supabase-js ที่ getSession() ค้างค้าง
// (deadlock) บนแท็บที่เปิดนาน/หลายแท็บ ทำให้อัปโหลดล้มด้วย "auth ค้าง"
const _supabase = window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storageKey: SB_STORAGE_KEY,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    lock: async (_name, _acquireTimeout, fn) => await fn(),
  },
});
window.supabase = _supabase;

// อ่าน access token แบบทนทาน: ลอง getSession (timeout สั้น) → ถ้าค้าง อ่านจาก localStorage
async function getAccessTokenFast() {
  try {
    const r = await Promise.race([
      _supabase.auth.getSession(),
      new Promise((_, rej) => setTimeout(() => rej(new Error('to')), 4000)),
    ]);
    const t = r?.data?.session?.access_token;
    if (t) return t;
  } catch (e) { /* fall through to localStorage */ }
  try {
    const raw = localStorage.getItem(SB_STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      return s?.access_token || s?.currentSession?.access_token || null;
    }
  } catch (e) {}
  return null;
}
window.getAccessTokenFast = getAccessTokenFast;

// ─── Projects ───────────────────────────────────────────────

async function getProjects(userId) {
  const { data, error } = await _supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data, error };
}

async function createProject(project, userId) {
  const { data, error } = await _supabase
    .from('projects')
    .insert([{ ...project, user_id: userId }])
    .select()
    .single();
  return { data, error };
}

async function updateProject(id, updates) {
  const { data, error } = await _supabase
    .from('projects')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

async function deleteProject(id) {
  // ลบ BOQ items ที่เชื่อมกับโปรเจกต์นี้ก่อน (foreign key)
  await _supabase.from('boq_items').delete().eq('project_id', id);
  // จากนั้นลบโปรเจกต์
  const { error } = await _supabase
    .from('projects')
    .delete()
    .eq('id', id);
  return { error };
}

// ─── BOQ Items ───────────────────────────────────────────────

async function getBOQItems(projectId) {
  const { data, error } = await _supabase
    .from('boq_items')
    .select('*')
    .eq('project_id', projectId)
    .order('category');
  return { data, error };
}

async function createBOQItem(item) {
  const { data, error } = await _supabase
    .from('boq_items')
    .insert([item])
    .select()
    .single();
  return { data, error };
}

async function updateBOQItem(id, updates) {
  const { data, error } = await _supabase
    .from('boq_items')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

async function deleteBOQItem(id) {
  const { error } = await _supabase
    .from('boq_items')
    .delete()
    .eq('id', id);
  return { error };
}

// ─── Realtime ────────────────────────────────────────────────

function subscribeToProjectChanges(projectId, callback) {
  return _supabase
    .channel(`project:${projectId}`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'boq_items', filter: `project_id=eq.${projectId}` },
      payload => callback(payload)
    )
    .subscribe();
}

// Export to window
window.getProjects = getProjects;
window.createProject = createProject;
window.updateProject = updateProject;
window.deleteProject = deleteProject;
window.getBOQItems = getBOQItems;
window.createBOQItem = createBOQItem;
window.updateBOQItem = updateBOQItem;
window.deleteBOQItem = deleteBOQItem;
window.subscribeToProjectChanges = subscribeToProjectChanges;
