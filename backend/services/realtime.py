from database import supabase

def subscribe_to_alerts(callback):
    channel = (supabase
               .channel("alerts")
               .on("postgres_changes",
                   event="INSERT",
                   schema="public",
                   table="alerts",
                   callback=callback)
               .subscribe())
    return channel