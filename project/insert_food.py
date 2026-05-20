import psycopg2
from datetime import datetime

conn = psycopg2.connect(
    dbname="Movie_Booking_System",
    user="postgres",
    password="Rahul@2167",
    host="localhost",
    port="5432"
)

cursor = conn.cursor()

cursor.execute("SELECT theatre_id FROM theatres LIMIT 1;")
row = cursor.fetchone()

if row:
    theatre_id = row[0]
    
    cursor.execute("SELECT count(*) FROM food_items WHERE name = 'Large Popcorn';")
    count = cursor.fetchone()[0]
    
    if count == 0:
        cursor.execute("""
            INSERT INTO food_items (name, description, price, is_available, theatre_id, created_at) 
            VALUES (%s, %s, %s, %s, %s, %s)
        """, ("Large Popcorn", "Freshly popped salty popcorn", 250.0, True, theatre_id, datetime.now()))
        
        cursor.execute("""
            INSERT INTO food_items (name, description, price, is_available, theatre_id, created_at) 
            VALUES (%s, %s, %s, %s, %s, %s)
        """, ("Coca Cola 500ml", "Chilled refreshing beverage", 150.0, True, theatre_id, datetime.now()))
        
        conn.commit()
        print("Inserted food options.")
    else:
        print("Food item already exists.")
else:
    print("No theatres found to link food item to.")

cursor.close()
conn.close()
