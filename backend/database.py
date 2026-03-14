from supabase import create_client
from config import SUPABASE_URL, SUPABASE_KEY

_supabase = None

def get_supabase():
    global _supabase
    if not SUPABASE_URL or not SUPABASE_KEY:
        return None
    if _supabase is None:
        _supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _supabase

supabase = get_supabase()
