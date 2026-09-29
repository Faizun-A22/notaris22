import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { clearStorageData } from '../lib/storage';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Ambil profile dari tabel profiles berdasarkan user id
  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[AuthContext] Error fetching profile:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        userId,
      });
      return null;
    }

    // Check if the user has been deactivated by owner
    if (data && data.is_active === false) {
      console.warn('[AuthContext] Akun ini telah dinonaktifkan oleh owner.');
      clearStorageData();
      await supabase.auth.signOut();
      return null;
    }

    return data;
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          setUser(session.user);
          const prof = await fetchProfile(session.user.id);
          if (prof && mounted) {
            setProfile(prof);
          } else if (mounted) {
            // Fallback profile if profile record missing or fetch error
            setProfile({
              id: session.user.id,
              email: session.user.email,
              role: session.user.user_metadata?.role || 'staff',
              full_name: session.user.user_metadata?.full_name || 'User',
            });
          }
        } else if (mounted) {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error('[AuthContext] getSession error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          const prof = await fetchProfile(session.user.id);
          if (prof && mounted) {
            setProfile(prof);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const resolveEmailFromIdentifier = async (identifier) => {
    if (!identifier) return '';
    const clean = identifier.trim();
    if (clean.includes('@')) {
      return clean;
    }

    // Sanitize phone number: keep only leading '+' and digits
    const sanitizedPhone = clean.replace(/[^\d+]/g, '');
    if (!sanitizedPhone || sanitizedPhone.length < 6) {
      return clean;
    }

    try {
      const pureDigits = sanitizedPhone.replace(/^\+/, '');
      const { data: prof } = await supabase
        .from('profiles')
        .select('email')
        .or(`phone.eq.${pureDigits},phone.eq.+${pureDigits}`)
        .limit(1)
        .maybeSingle();

      if (prof?.email) {
        return prof.email;
      }
    } catch (err) {
      console.warn('[AuthContext] Phone lookup error:', err);
    }
    return clean;
  };

  /**
   * Login untuk Owner — hanya role 'owner' yang diperbolehkan masuk
   */
  const loginAsOwner = async (identifier, password) => {
    const email = await resolveEmailFromIdentifier(identifier);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error('[AuthContext] Login error:', error);
      // Email belum dikonfirmasi
      if (error.message?.includes('Email not confirmed')) {
        return { success: false, message: 'Email belum dikonfirmasi. Cek kotak masuk email Anda atau hubungi admin.' };
      }
      return { success: false, message: 'Email / Nomor Telepon atau password salah.' };
    }

    // Verifikasi role harus 'owner'
    const prof = await fetchProfile(data.user.id);
    console.log('[AuthContext] Profile fetched:', prof);
    
    if (!prof) {
      clearStorageData();
      await supabase.auth.signOut();
      return {
        success: false,
        message: 'Profil akun tidak ditemukan. Pastikan data profile sudah diisi di database.',
      };
    }
    
    if (prof.role !== 'owner') {
      clearStorageData();
      await supabase.auth.signOut();
      return {
        success: false,
        message: 'Akun ini bukan akun Owner. Silakan gunakan halaman login Staff.',
      };
    }

    setUser(data.user);
    setProfile(prof);
    return { success: true, profile: prof };
  };

  /**
   * Login untuk Staff — hanya role 'staff' yang diperbolehkan masuk
   */
  const loginAsStaff = async (identifier, password) => {
    const email = await resolveEmailFromIdentifier(identifier);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error('[AuthContext] Login error:', error);
      if (error.message?.includes('Email not confirmed')) {
        return { success: false, message: 'Email belum dikonfirmasi. Cek kotak masuk email Anda atau hubungi admin.' };
      }
      return { success: false, message: 'Email / Nomor Telepon atau password salah.' };
    }

    // Verifikasi role harus 'staff'
    const prof = await fetchProfile(data.user.id);
    console.log('[AuthContext] Profile fetched:', prof);
    
    if (!prof) {
      clearStorageData();
      await supabase.auth.signOut();
      return {
        success: false,
        message: 'Profil akun tidak ditemukan. Pastikan data profile sudah diisi di database.',
      };
    }
    
    if (prof.role !== 'staff') {
      clearStorageData();
      await supabase.auth.signOut();
      return {
        success: false,
        message: 'Akun ini bukan akun Staff. Silakan gunakan halaman login Owner.',
      };
    }

    setUser(data.user);
    setProfile(prof);
    return { success: true, profile: prof };
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('[AuthContext] SignOut error:', err);
    } finally {
      clearStorageData();
      setUser(null);
      setProfile(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, setProfile, loading, loginAsOwner, loginAsStaff, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
