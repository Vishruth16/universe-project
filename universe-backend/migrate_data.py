"""
Migrate all data from SQLite (db.sqlite3) to PostgreSQL.
Run with: python manage.py shell < migrate_data.py
"""
import sqlite3
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'universe_backend.settings')

from django.contrib.auth.models import User
from django.db import connection
from user_profiles.models import UserProfile, RoommateProfile
from marketplace.models import MarketplaceItem, ItemImage, MarketplaceMessage
from housing.models import HousingListing, HousingImage, HousingInquiry
from roommate_matching.models import MatchRequest, CompatibilityScore
from study_groups.models import StudyGroup, GroupMembership, GroupMessage
from rest_framework.authtoken.models import Token

SQLITE_PATH = os.path.join(os.path.dirname(__file__), 'db.sqlite3')

def get_sqlite_rows(table):
    conn = sqlite3.connect(SQLITE_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(f'SELECT * FROM [{table}]').fetchall()
    result = [dict(r) for r in rows]
    conn.close()
    return result

def reset_sequence(table_name):
    """Reset PostgreSQL auto-increment sequence to max id."""
    with connection.cursor() as cursor:
        cursor.execute(f"SELECT MAX(id) FROM {table_name}")
        max_id = cursor.fetchone()[0]
        if max_id:
            cursor.execute(f"SELECT setval(pg_get_serial_sequence('{table_name}', 'id'), {max_id})")

def migrate_users():
    rows = get_sqlite_rows('auth_user')
    # Skip if the superuser you already created matches
    existing_usernames = set(User.objects.values_list('username', flat=True))

    for r in rows:
        if r['username'] in existing_usernames:
            # Update existing user to match SQLite data (preserve the new superuser's password if it's the admin)
            u = User.objects.get(username=r['username'])
            # Don't overwrite password for existing superuser
            print(f"  Skipping existing user: {r['username']}")
            continue

        u = User(
            id=r['id'],
            password=r['password'],
            is_superuser=bool(r['is_superuser']),
            username=r['username'],
            first_name=r['first_name'] or '',
            last_name=r['last_name'] or '',
            email=r['email'] or '',
            is_staff=bool(r['is_staff']),
            is_active=bool(r['is_active']),
            date_joined=r['date_joined'],
        )
        if r['last_login']:
            u.last_login = r['last_login']
        u.save()
        print(f"  Created user: {r['username']} (id={r['id']})")

    reset_sequence('auth_user')
    print(f"Migrated {len(rows)} users")

def migrate_tokens():
    rows = get_sqlite_rows('authtoken_token')
    for r in rows:
        if not Token.objects.filter(key=r['key']).exists():
            Token.objects.create(
                key=r['key'],
                user_id=r['user_id'],
                created=r['created'],
            )
    print(f"Migrated {len(rows)} tokens")

def migrate_user_profiles():
    rows = get_sqlite_rows('user_profiles_userprofile')
    for r in rows:
        if UserProfile.objects.filter(user_id=r['user_id']).exists():
            print(f"  Skipping existing profile for user_id={r['user_id']}")
            continue
        UserProfile.objects.create(
            id=r['id'],
            user_id=r['user_id'],
            first_name=r['first_name'] or '',
            last_name=r['last_name'] or '',
            age=r.get('age'),
            gender=r.get('gender', ''),
            interests=r.get('interests', ''),
            course_major=r.get('course_major', ''),
            bio=r.get('bio', ''),
            profile_picture=r.get('profile_picture', '') or '',
        )
    reset_sequence('user_profiles_userprofile')
    print(f"Migrated {len(rows)} user profiles")

def migrate_roommate_profiles():
    rows = get_sqlite_rows('user_profiles_roommateprofile')
    for r in rows:
        if RoommateProfile.objects.filter(user_profile_id=r['user_profile_id']).exists():
            continue
        RoommateProfile.objects.create(
            id=r['id'],
            user_profile_id=r['user_profile_id'],
            smoking_preference=r.get('smoking_preference', 'no_preference'),
            drinking_preference=r.get('drinking_preference', 'no_preference'),
            sleep_habits=r.get('sleep_habits', 'average'),
            study_habits=r.get('study_habits', 'library'),
            guests_preference=r.get('guests_preference', 'no_preference'),
            cleanliness_level=r.get('cleanliness_level', 3),
            max_rent_budget=r.get('max_rent_budget'),
            preferred_move_in_date=r.get('preferred_move_in_date'),
        )
    reset_sequence('user_profiles_roommateprofile')
    print(f"Migrated {len(rows)} roommate profiles")

def migrate_marketplace_items():
    rows = get_sqlite_rows('marketplace_marketplaceitem')
    for r in rows:
        if MarketplaceItem.objects.filter(id=r['id']).exists():
            continue
        MarketplaceItem.objects.create(
            id=r['id'],
            seller_id=r['seller_id'],
            title=r['title'],
            description=r['description'],
            price=r['price'],
            item_type=r['item_type'],
            condition=r.get('condition', 'good'),
            location=r.get('location', ''),
            item_pickup_deadline=r.get('item_pickup_deadline'),
            is_sold=bool(r.get('is_sold', False)),
            posted_date=r['posted_date'],
        )
    reset_sequence('marketplace_marketplaceitem')
    print(f"Migrated {len(rows)} marketplace items")

def migrate_marketplace_images():
    rows = get_sqlite_rows('marketplace_itemimage')
    for r in rows:
        if ItemImage.objects.filter(id=r['id']).exists():
            continue
        ItemImage.objects.create(
            id=r['id'],
            item_id=r['item_id'],
            image=r['image'],
        )
    reset_sequence('marketplace_itemimage')
    print(f"Migrated {len(rows)} item images")

def migrate_housing_listings():
    rows = get_sqlite_rows('housing_housinglisting')
    for r in rows:
        if HousingListing.objects.filter(id=r['id']).exists():
            continue
        HousingListing.objects.create(
            id=r['id'],
            posted_by_id=r['posted_by_id'],
            title=r['title'],
            description=r['description'],
            housing_type=r['housing_type'],
            address=r['address'],
            city=r['city'],
            state=r['state'],
            zip_code=r['zip_code'],
            latitude=r.get('latitude'),
            longitude=r.get('longitude'),
            distance_to_campus=r.get('distance_to_campus'),
            rent_price=r['rent_price'],
            bedrooms=r.get('bedrooms', 1),
            bathrooms=r.get('bathrooms', 1),
            sq_ft=r.get('sq_ft'),
            lease_type=r.get('lease_type', 'yearly'),
            available_from=r.get('available_from'),
            available_to=r.get('available_to'),
            furnished=bool(r.get('furnished', False)),
            pets_allowed=bool(r.get('pets_allowed', False)),
            parking=bool(r.get('parking', False)),
            laundry=bool(r.get('laundry', False)),
            wifi_included=bool(r.get('wifi_included', False)),
            ac=bool(r.get('ac', False)),
            utilities_included=bool(r.get('utilities_included', False)),
            amenities=r.get('amenities', ''),
            is_available=bool(r.get('is_available', True)),
            posted_date=r['posted_date'],
            updated_date=r['updated_date'],
        )
    reset_sequence('housing_housinglisting')
    print(f"Migrated {len(rows)} housing listings")

def migrate_housing_images():
    rows = get_sqlite_rows('housing_housingimage')
    for r in rows:
        if HousingImage.objects.filter(id=r['id']).exists():
            continue
        HousingImage.objects.create(
            id=r['id'],
            listing_id=r['listing_id'],
            image=r['image'],
        )
    reset_sequence('housing_housingimage')
    print(f"Migrated {len(rows)} housing images")

def migrate_study_groups():
    rows = get_sqlite_rows('study_groups_studygroup')
    for r in rows:
        if StudyGroup.objects.filter(id=r['id']).exists():
            continue
        StudyGroup.objects.create(
            id=r['id'],
            creator_id=r['creator_id'],
            name=r['name'],
            course_code=r.get('course_code', ''),
            subject_area=r['subject_area'],
            description=r['description'],
            max_members=r.get('max_members', 10),
            meeting_location=r.get('meeting_location', ''),
            meeting_schedule=r.get('meeting_schedule', ''),
            meeting_frequency=r.get('meeting_frequency', 'weekly'),
            is_online=bool(r.get('is_online', False)),
            meeting_link=r.get('meeting_link', ''),
            is_active=bool(r.get('is_active', True)),
            created_date=r['created_date'],
            updated_date=r['updated_date'],
        )
    reset_sequence('study_groups_studygroup')
    print(f"Migrated {len(rows)} study groups")

def migrate_group_memberships():
    rows = get_sqlite_rows('study_groups_groupmembership')
    for r in rows:
        if GroupMembership.objects.filter(id=r['id']).exists():
            continue
        GroupMembership.objects.create(
            id=r['id'],
            group_id=r['group_id'],
            user_id=r['user_id'],
            role=r.get('role', 'member'),
            is_active=bool(r.get('is_active', True)),
            joined_date=r['joined_date'],
        )
    reset_sequence('study_groups_groupmembership')
    print(f"Migrated {len(rows)} group memberships")

def migrate_group_messages():
    rows = get_sqlite_rows('study_groups_groupmessage')
    for r in rows:
        if GroupMessage.objects.filter(id=r['id']).exists():
            continue
        GroupMessage.objects.create(
            id=r['id'],
            group_id=r['group_id'],
            sender_id=r['sender_id'],
            content=r['content'],
            timestamp=r['timestamp'],
        )
    reset_sequence('study_groups_groupmessage')
    print(f"Migrated {len(rows)} group messages")

def migrate_compatibility_scores():
    rows = get_sqlite_rows('roommate_matching_compatibilityscore')
    for r in rows:
        if CompatibilityScore.objects.filter(id=r['id']).exists():
            continue
        CompatibilityScore.objects.create(
            id=r['id'],
            user1_id=r['user1_id'],
            user2_id=r['user2_id'],
            score=r['score'],
        )
    reset_sequence('roommate_matching_compatibilityscore')
    print(f"Migrated {len(rows)} compatibility scores")


print("=" * 50)
print("Starting data migration: SQLite -> PostgreSQL")
print("=" * 50)

migrate_users()
migrate_tokens()
migrate_user_profiles()
migrate_roommate_profiles()
migrate_marketplace_items()
migrate_marketplace_images()
migrate_housing_listings()
migrate_housing_images()
migrate_study_groups()
migrate_group_memberships()
migrate_group_messages()
migrate_compatibility_scores()

print("=" * 50)
print("Migration complete!")
print("=" * 50)
