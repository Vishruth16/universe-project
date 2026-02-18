import sqlite3
import os
from django.core.management.base import BaseCommand
from django.conf import settings
from django.db import connection
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from user_profiles.models import UserProfile, RoommateProfile
from marketplace.models import MarketplaceItem, ItemImage, MarketplaceMessage
from housing.models import HousingListing, HousingImage, HousingInquiry
from roommate_matching.models import MatchRequest, CompatibilityScore
from study_groups.models import StudyGroup, GroupMembership, GroupMessage


SQLITE_PATH = os.path.join(settings.BASE_DIR, 'db.sqlite3')


def get_rows(table):
    conn = sqlite3.connect(SQLITE_PATH)
    conn.row_factory = sqlite3.Row
    rows = [dict(r) for r in conn.execute(f'SELECT * FROM [{table}]').fetchall()]
    conn.close()
    return rows


def reset_seq(table_name):
    with connection.cursor() as cur:
        cur.execute(f"SELECT MAX(id) FROM {table_name}")
        max_id = cur.fetchone()[0]
        if max_id:
            cur.execute(f"SELECT setval(pg_get_serial_sequence('{table_name}', 'id'), {max_id})")


class Command(BaseCommand):
    help = 'Migrate data from SQLite db.sqlite3 to the current PostgreSQL database'

    def handle(self, *args, **options):
        if not os.path.exists(SQLITE_PATH):
            self.stderr.write(f'SQLite file not found: {SQLITE_PATH}')
            return

        self.stdout.write('=== Migrating SQLite -> PostgreSQL ===\n')

        self._migrate_users()
        self._migrate_tokens()
        self._migrate_user_profiles()
        self._migrate_roommate_profiles()
        self._migrate_marketplace_items()
        self._migrate_marketplace_images()
        self._migrate_housing_listings()
        self._migrate_housing_images()
        self._migrate_study_groups()
        self._migrate_group_memberships()
        self._migrate_group_messages()
        self._migrate_compatibility_scores()

        self.stdout.write(self.style.SUCCESS('\n=== Migration complete! ==='))

    def _migrate_users(self):
        rows = get_rows('auth_user')
        existing = set(User.objects.values_list('username', flat=True))
        created = 0
        for r in rows:
            if r['username'] in existing:
                self.stdout.write(f"  Skip existing user: {r['username']}")
                continue
            u = User(
                id=r['id'], password=r['password'],
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
            created += 1
        reset_seq('auth_user')
        self.stdout.write(f"Users: {created} created, {len(rows) - created} skipped")

    def _migrate_tokens(self):
        rows = get_rows('authtoken_token')
        count = 0
        for r in rows:
            if not Token.objects.filter(key=r['key']).exists():
                try:
                    Token.objects.create(key=r['key'], user_id=r['user_id'], created=r['created'])
                    count += 1
                except Exception as e:
                    self.stdout.write(f"  Token skip (user_id={r['user_id']}): {e}")
        self.stdout.write(f"Tokens: {count} created")

    def _migrate_user_profiles(self):
        rows = get_rows('user_profiles_userprofile')
        count = 0
        for r in rows:
            if UserProfile.objects.filter(user_id=r['user_id']).exists():
                continue
            try:
                UserProfile.objects.create(
                    id=r['id'], user_id=r['user_id'],
                    first_name=r.get('first_name', ''),
                    last_name=r.get('last_name', ''),
                    age=r.get('age'),
                    gender=r.get('gender', ''),
                    interests=r.get('interests', ''),
                    course_major=r.get('course_major', ''),
                    bio=r.get('bio', ''),
                    profile_picture=r.get('profile_picture', '') or '',
                )
                count += 1
            except Exception as e:
                self.stdout.write(f"  Profile skip (user_id={r['user_id']}): {e}")
        reset_seq('user_profiles_userprofile')
        self.stdout.write(f"User profiles: {count} created")

    def _migrate_roommate_profiles(self):
        rows = get_rows('user_profiles_roommateprofile')
        count = 0
        for r in rows:
            if RoommateProfile.objects.filter(user_profile_id=r['user_profile_id']).exists():
                continue
            RoommateProfile.objects.create(
                id=r['id'], user_profile_id=r['user_profile_id'],
                smoking_preference=r.get('smoking_preference', 'no_preference'),
                drinking_preference=r.get('drinking_preference', 'no_preference'),
                sleep_habits=r.get('sleep_habits', 'average'),
                study_habits=r.get('study_habits', 'library'),
                guests_preference=r.get('guests_preference', 'no_preference'),
                cleanliness_level=r.get('cleanliness_level', 3),
                max_rent_budget=r.get('max_rent_budget'),
                preferred_move_in_date=r.get('preferred_move_in_date'),
            )
            count += 1
        reset_seq('user_profiles_roommateprofile')
        self.stdout.write(f"Roommate profiles: {count} created")

    def _migrate_marketplace_items(self):
        rows = get_rows('marketplace_marketplaceitem')
        count = 0
        for r in rows:
            if MarketplaceItem.objects.filter(id=r['id']).exists():
                continue
            MarketplaceItem.objects.create(
                id=r['id'], seller_id=r['seller_id'],
                title=r['title'], description=r['description'],
                price=r['price'], item_type=r['item_type'],
                condition=r.get('condition', 'good'),
                location=r.get('location', ''),
                item_pickup_deadline=r.get('item_pickup_deadline'),
                is_sold=bool(r.get('is_sold', False)),
                posted_date=r['posted_date'],
            )
            count += 1
        reset_seq('marketplace_marketplaceitem')
        self.stdout.write(f"Marketplace items: {count} created")

    def _migrate_marketplace_images(self):
        rows = get_rows('marketplace_itemimage')
        count = 0
        for r in rows:
            if ItemImage.objects.filter(id=r['id']).exists():
                continue
            ItemImage.objects.create(id=r['id'], item_id=r['item_id'], image=r['image'])
            count += 1
        reset_seq('marketplace_itemimage')
        self.stdout.write(f"Item images: {count} created")

    def _migrate_housing_listings(self):
        rows = get_rows('housing_housinglisting')
        count = 0
        for r in rows:
            if HousingListing.objects.filter(id=r['id']).exists():
                continue
            HousingListing.objects.create(
                id=r['id'], posted_by_id=r['posted_by_id'],
                title=r['title'], description=r['description'],
                housing_type=r['housing_type'],
                address=r['address'], city=r['city'],
                state=r['state'], zip_code=r['zip_code'],
                latitude=r.get('latitude'), longitude=r.get('longitude'),
                distance_to_campus=r.get('distance_to_campus'),
                rent_price=r['rent_price'],
                bedrooms=r.get('bedrooms', 1), bathrooms=r.get('bathrooms', 1),
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
            count += 1
        reset_seq('housing_housinglisting')
        self.stdout.write(f"Housing listings: {count} created")

    def _migrate_housing_images(self):
        rows = get_rows('housing_housingimage')
        count = 0
        for r in rows:
            if HousingImage.objects.filter(id=r['id']).exists():
                continue
            HousingImage.objects.create(id=r['id'], listing_id=r['listing_id'], image=r['image'])
            count += 1
        reset_seq('housing_housingimage')
        self.stdout.write(f"Housing images: {count} created")

    def _migrate_study_groups(self):
        rows = get_rows('study_groups_studygroup')
        count = 0
        for r in rows:
            if StudyGroup.objects.filter(id=r['id']).exists():
                continue
            StudyGroup.objects.create(
                id=r['id'], creator_id=r['creator_id'],
                name=r['name'], course_code=r.get('course_code', ''),
                subject_area=r['subject_area'], description=r['description'],
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
            count += 1
        reset_seq('study_groups_studygroup')
        self.stdout.write(f"Study groups: {count} created")

    def _migrate_group_memberships(self):
        rows = get_rows('study_groups_groupmembership')
        count = 0
        for r in rows:
            if GroupMembership.objects.filter(id=r['id']).exists():
                continue
            GroupMembership.objects.create(
                id=r['id'], group_id=r['group_id'], user_id=r['user_id'],
                role=r.get('role', 'member'),
                is_active=bool(r.get('is_active', True)),
                joined_date=r['joined_date'],
            )
            count += 1
        reset_seq('study_groups_groupmembership')
        self.stdout.write(f"Group memberships: {count} created")

    def _migrate_group_messages(self):
        rows = get_rows('study_groups_groupmessage')
        count = 0
        for r in rows:
            if GroupMessage.objects.filter(id=r['id']).exists():
                continue
            GroupMessage.objects.create(
                id=r['id'], group_id=r['group_id'],
                sender_id=r['sender_id'], content=r['content'],
                timestamp=r['timestamp'],
            )
            count += 1
        reset_seq('study_groups_groupmessage')
        self.stdout.write(f"Group messages: {count} created")

    def _migrate_compatibility_scores(self):
        rows = get_rows('roommate_matching_compatibilityscore')
        count = 0
        for r in rows:
            if CompatibilityScore.objects.filter(id=r['id']).exists():
                continue
            CompatibilityScore.objects.create(
                id=r['id'], user1_id=r['user1_id'],
                user2_id=r['user2_id'], score=r['score'],
            )
            count += 1
        reset_seq('roommate_matching_compatibilityscore')
        self.stdout.write(f"Compatibility scores: {count} created")
