from supabase import create_client, Client
from config.settings import settings


class SupabaseClient:
    """Singleton Supabase client for database operations"""
    
    _instance: Client = None
    
    @classmethod
    def get_client(cls) -> Client:
        """Get or create Supabase client instance"""
        if cls._instance is None:
            cls._instance = create_client(
                settings.supabase_url,
                settings.supabase_key
            )
        return cls._instance
    
    @classmethod
    def get_admin_client(cls) -> Client:
        """Get Supabase client with service role key for admin operations"""
        if settings.supabase_service_key:
            return create_client(
                settings.supabase_url,
                settings.supabase_service_key
            )
        return cls.get_client()


# Convenience function
def get_supabase() -> Client:
    """Get Supabase client instance"""
    return SupabaseClient.get_client()
