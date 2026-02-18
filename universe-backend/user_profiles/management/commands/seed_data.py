import random
from datetime import date, timedelta
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from user_profiles.models import UserProfile, RoommateProfile
from marketplace.models import MarketplaceItem
from housing.models import HousingListing
from study_groups.models import StudyGroup, GroupMembership


class Command(BaseCommand):
    help = 'Seed the database with dummy data for all features'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...\n')

        users = self._create_users()
        self._create_profiles(users)
        self._create_roommate_profiles(users)
        self._create_marketplace_items(users)
        self._create_housing_listings(users)
        self._create_study_groups(users)

        self.stdout.write(self.style.SUCCESS('\nDatabase seeded successfully!'))

    def _create_users(self):
        self.stdout.write('Creating users...')
        user_data = [
            ('alice_chen', 'alice@university.edu', 'Alice', 'Chen'),
            ('bob_smith', 'bob@university.edu', 'Bob', 'Smith'),
            ('carol_jones', 'carol@university.edu', 'Carol', 'Jones'),
            ('david_kim', 'david@university.edu', 'David', 'Kim'),
            ('emma_wilson', 'emma@university.edu', 'Emma', 'Wilson'),
            ('frank_garcia', 'frank@university.edu', 'Frank', 'Garcia'),
            ('grace_lee', 'grace@university.edu', 'Grace', 'Lee'),
            ('henry_brown', 'henry@university.edu', 'Henry', 'Brown'),
            ('iris_patel', 'iris@university.edu', 'Iris', 'Patel'),
            ('jack_taylor', 'jack@university.edu', 'Jack', 'Taylor'),
            ('kate_nguyen', 'kate@university.edu', 'Kate', 'Nguyen'),
            ('liam_davis', 'liam@university.edu', 'Liam', 'Davis'),
            ('mia_rodriguez', 'mia@university.edu', 'Mia', 'Rodriguez'),
            ('noah_martinez', 'noah@university.edu', 'Noah', 'Martinez'),
            ('olivia_thomas', 'olivia@university.edu', 'Olivia', 'Thomas'),
        ]

        users = []
        for username, email, first, last in user_data:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': email,
                    'first_name': first,
                    'last_name': last,
                }
            )
            if created:
                user.set_password('testpass123')
                user.save()
            users.append(user)

        self.stdout.write(f'  Created {len(users)} users')
        return users

    def _create_profiles(self, users):
        self.stdout.write('Creating user profiles...')

        majors = [
            'Computer Science', 'Mathematics', 'Biology', 'English Literature',
            'Business Administration', 'Physics', 'Psychology', 'Mechanical Engineering',
            'Chemistry', 'Political Science', 'Art History', 'Economics',
            'Electrical Engineering', 'Sociology', 'Nursing',
        ]

        interests_pool = [
            'hiking', 'reading', 'gaming', 'cooking', 'photography', 'music',
            'basketball', 'yoga', 'painting', 'coding', 'movies', 'travel',
            'swimming', 'chess', 'dancing', 'running', 'guitar', 'anime',
            'volunteering', 'robotics', 'debate', 'writing', 'cycling', 'soccer',
        ]

        bios = [
            "Passionate about technology and always looking for new coding challenges. Love late-night study sessions with good music.",
            "Avid reader and coffee enthusiast. Looking for a quiet and respectful living environment.",
            "Biology major who loves the outdoors. When I'm not in the lab, you'll find me hiking or rock climbing.",
            "Creative writing enthusiast with a love for storytelling. I enjoy quiet evenings and weekend adventures.",
            "Business student with an entrepreneurial spirit. I'm organized, friendly, and love networking events.",
            "Physics nerd who enjoys stargazing and solving puzzles. I keep my space tidy and respect quiet hours.",
            "Psychology student interested in human behavior. I'm empathetic, a great listener, and love deep conversations.",
            "Engineering student who builds robots in spare time. I'm handy around the house and love fixing things.",
            "Chemistry major with a passion for cooking (they're basically the same thing!). I love trying new recipes.",
            "Political science student who follows current events obsessively. I enjoy healthy debates and diverse perspectives.",
            "Art history student with an eye for design. I love visiting museums and decorating shared spaces.",
            "Economics major who's always crunching numbers. I'm budget-conscious and great at splitting expenses fairly.",
            "Electrical engineering student who loves tinkering with circuits. Night owl with a passion for innovation.",
            "Sociology student studying community dynamics. I'm outgoing, love hosting small gatherings, and making everyone feel welcome.",
            "Nursing student who keeps odd hours but is always considerate. I'm caring, organized, and good in emergencies.",
        ]

        genders = ['male', 'female', 'male', 'male', 'female', 'male', 'female',
                    'male', 'female', 'male', 'female', 'male', 'female', 'male', 'female']

        count = 0
        for i, user in enumerate(users):
            _, created = UserProfile.objects.get_or_create(
                user=user,
                defaults={
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'age': random.randint(18, 25),
                    'gender': genders[i],
                    'interests': ', '.join(random.sample(interests_pool, random.randint(3, 6))),
                    'course_major': majors[i],
                    'bio': bios[i],
                }
            )
            if created:
                count += 1
        self.stdout.write(f'  Created {count} user profiles')

    def _create_roommate_profiles(self, users):
        self.stdout.write('Creating roommate profiles...')

        smoking_opts = ['no', 'no', 'no', 'sometimes', 'no_preference']
        drinking_opts = ['no', 'sometimes', 'yes', 'no_preference', 'no']
        sleep_opts = ['early_riser', 'night_owl', 'average']
        study_opts = ['in_room', 'library', 'other_places']
        guests_opts = ['sometimes', 'yes', 'no', 'no_preference']

        count = 0
        for user in users:
            try:
                profile = UserProfile.objects.get(user=user)
            except UserProfile.DoesNotExist:
                continue

            _, created = RoommateProfile.objects.get_or_create(
                user_profile=profile,
                defaults={
                    'smoking_preference': random.choice(smoking_opts),
                    'drinking_preference': random.choice(drinking_opts),
                    'sleep_habits': random.choice(sleep_opts),
                    'study_habits': random.choice(study_opts),
                    'guests_preference': random.choice(guests_opts),
                    'cleanliness_level': random.randint(2, 5),
                    'max_rent_budget': Decimal(str(random.randint(600, 1800))),
                    'preferred_move_in_date': date.today() + timedelta(days=random.randint(30, 180)),
                }
            )
            if created:
                count += 1
        self.stdout.write(f'  Created {count} roommate profiles')

    def _create_marketplace_items(self, users):
        self.stdout.write('Creating marketplace items...')

        items_data = [
            ('IKEA Desk - Great Condition', 'Sturdy IKEA MALM desk, white finish. Used for one semester. Has a pull-out panel for extra workspace. Minor scratch on the side but otherwise perfect.', '75.00', 'furniture', 'good', 'Dorm Hall B, Room 204'),
            ('MacBook Pro 2023 M2', 'Selling my MacBook Pro 14-inch M2 chip. 16GB RAM, 512GB SSD. Includes original charger and box. Battery health at 95%. Great for CS students.', '1200.00', 'electronics', 'like_new', 'Student Union Building'),
            ('Calculus Textbook - Stewart 9th Ed', "James Stewart's Calculus: Early Transcendentals, 9th edition. Highlighted in chapters 1-8 but no torn pages. Required for MATH 201.", '45.00', 'books', 'good', 'Library Main Floor'),
            ('Winter Jacket - North Face', 'North Face Thermoball Eco Jacket, size M, black. Worn only a few times. Super warm and lightweight. Moving to a warmer climate so selling.', '85.00', 'clothing', 'like_new', 'West Campus Dorms'),
            ('Mini Fridge - Perfect for Dorms', 'Compact 3.2 cu ft mini fridge by Midea. Runs quietly, has a small freezer compartment. Used for 2 semesters. Pick up from parking lot.', '60.00', 'kitchen', 'fair', 'Parking Lot C'),
            ('Organic Protein Bars (24-pack)', 'Unopened box of RXBAR protein bars, variety pack. Bought too many at Costco. Expiration date is 6 months out.', '25.00', 'groceries', 'new', 'Science Building Lobby'),
            ('Gaming Monitor 27" 144Hz', 'ASUS VG27AQ 27-inch gaming monitor, 144Hz, 1440p. IPS panel with amazing colors. Includes stand, power cable, and DisplayPort cable.', '220.00', 'electronics', 'good', 'East Campus Apartments'),
            ('Yoga Mat + Resistance Bands', 'Premium thick yoga mat (extra cushion) plus a set of 5 resistance bands. Used for home workouts. Clean and in great shape.', '30.00', 'other', 'good', 'Gym Lobby'),
            ('Bookshelf - 5 Tier', 'Simple 5-tier bookshelf, dark wood finish. Perfect for dorm or apartment. Easy to assemble. Currently disassembled for easy transport.', '40.00', 'furniture', 'good', 'Storage Unit near West Hall'),
            ('Chemistry Lab Coat', "White lab coat, size S. Required for CHEM lab courses. Worn for one semester, freshly laundered. Name tag can be removed.", '15.00', 'clothing', 'good', 'Chemistry Building'),
            ('Bluetooth Speaker - JBL Flip 5', 'JBL Flip 5 portable speaker in blue. Waterproof, amazing bass. Battery lasts about 10 hours. Perfect for dorm parties or outdoor hangouts.', '55.00', 'electronics', 'good', 'Music Hall'),
            ('Complete Cooking Set', '15-piece non-stick cookware set including pots, pans, and utensils. Used for one year. Some wear on the non-stick coating of the main pan.', '35.00', 'kitchen', 'fair', 'Apartment Complex B'),
            ('Desk Lamp with USB Port', 'LED desk lamp with adjustable brightness, color temperature, and a built-in USB charging port. Barely used, still has the box.', '20.00', 'electronics', 'like_new', 'Engineering Building'),
            ('Psychology Textbook Bundle', '3 psych textbooks: Intro to Psychology (Myers), Abnormal Psychology (Barlow), and Research Methods. All in good condition with minimal highlighting.', '80.00', 'books', 'good', 'Psychology Department'),
            ('Bicycle - Trek FX 2', 'Trek FX 2 hybrid bicycle, great for campus commuting. 21-speed, recently tuned up. Includes lock and lights. A few cosmetic scratches.', '250.00', 'other', 'good', 'Bike Rack near Main Gate'),
            ('Air Purifier - Small Room', 'LEVOIT air purifier for rooms up to 200 sq ft. HEPA filter, 3 fan speeds. Perfect for dorm rooms. Filter was replaced last month.', '40.00', 'electronics', 'good', 'Health Center'),
            ('Weighted Blanket 15lb', 'Soft weighted blanket, 15 lbs, queen size. Gray color. Helps with sleep and anxiety. Machine washable. Used for one semester.', '25.00', 'other', 'good', 'Residence Hall A'),
            ('Graphic Calculator TI-84 Plus', 'Texas Instruments TI-84 Plus CE graphing calculator. Essential for math and engineering courses. Works perfectly, includes USB cable.', '65.00', 'electronics', 'good', 'Math Department Lounge'),
        ]

        count = 0
        for title, desc, price, item_type, condition, location in items_data:
            seller = random.choice(users)
            _, created = MarketplaceItem.objects.get_or_create(
                title=title,
                defaults={
                    'seller': seller,
                    'description': desc,
                    'price': Decimal(price),
                    'item_type': item_type,
                    'condition': condition,
                    'location': location,
                    'is_sold': random.random() < 0.15,  # 15% chance of being sold
                }
            )
            if created:
                count += 1
        self.stdout.write(f'  Created {count} marketplace items')

    def _create_housing_listings(self, users):
        self.stdout.write('Creating housing listings...')

        listings_data = [
            {
                'title': 'Sunny 2BR Apartment Near Campus',
                'description': 'Bright and spacious 2-bedroom apartment just 5 minutes walk from campus. Recently renovated kitchen with stainless steel appliances. Hardwood floors throughout. South-facing windows bring in plenty of natural light. Quiet neighborhood perfect for studying.',
                'housing_type': 'apartment',
                'address': '123 College Ave',
                'city': 'University Town',
                'state': 'CA',
                'zip_code': '90210',
                'distance_to_campus': 0.3,
                'rent_price': '1400.00',
                'bedrooms': 2,
                'bathrooms': 1,
                'sq_ft': 850,
                'lease_type': 'yearly',
                'furnished': False,
                'pets_allowed': False,
                'parking': True,
                'laundry': True,
                'wifi_included': False,
                'ac': True,
                'utilities_included': False,
            },
            {
                'title': 'Cozy Studio - All Utilities Included',
                'description': 'Affordable studio apartment perfect for a student on a budget. All utilities included in rent. Walking distance to campus, grocery stores, and restaurants. Laundry in building. Quiet building with mostly graduate students.',
                'housing_type': 'studio',
                'address': '456 Student Lane',
                'city': 'University Town',
                'state': 'CA',
                'zip_code': '90211',
                'distance_to_campus': 0.5,
                'rent_price': '900.00',
                'bedrooms': 1,
                'bathrooms': 1,
                'sq_ft': 400,
                'lease_type': 'yearly',
                'furnished': True,
                'pets_allowed': False,
                'parking': False,
                'laundry': True,
                'wifi_included': True,
                'ac': True,
                'utilities_included': True,
            },
            {
                'title': 'Spacious 3BR House with Backyard',
                'description': 'Large 3-bedroom house perfect for a group of students. Huge backyard with BBQ area. Updated bathrooms, modern kitchen. Garage parking for 2 cars. Pet-friendly! Located in a quiet residential area 10 minutes from campus.',
                'housing_type': 'house',
                'address': '789 Oak Street',
                'city': 'University Town',
                'state': 'CA',
                'zip_code': '90212',
                'distance_to_campus': 1.2,
                'rent_price': '2200.00',
                'bedrooms': 3,
                'bathrooms': 2,
                'sq_ft': 1400,
                'lease_type': 'yearly',
                'furnished': False,
                'pets_allowed': True,
                'parking': True,
                'laundry': True,
                'wifi_included': False,
                'ac': True,
                'utilities_included': False,
            },
            {
                'title': 'Modern 1BR Condo - Gym & Pool Access',
                'description': 'Sleek modern condo in a gated community with gym, pool, and clubhouse access. In-unit washer/dryer, granite countertops, stainless steel appliances. One reserved parking spot included. Bus stop right outside the complex.',
                'housing_type': 'condo',
                'address': '101 Luxury Blvd, Unit 305',
                'city': 'University Town',
                'state': 'CA',
                'zip_code': '90213',
                'distance_to_campus': 0.8,
                'rent_price': '1600.00',
                'bedrooms': 1,
                'bathrooms': 1,
                'sq_ft': 700,
                'lease_type': 'yearly',
                'furnished': False,
                'pets_allowed': False,
                'parking': True,
                'laundry': True,
                'wifi_included': True,
                'ac': True,
                'utilities_included': False,
            },
            {
                'title': 'Private Room in Shared Townhouse',
                'description': 'Private bedroom in a 4-bedroom townhouse shared with 3 other students. Common living room, kitchen, and 2.5 bathrooms. Includes furnished common areas. Walking distance to campus and downtown. Great community vibe.',
                'housing_type': 'room',
                'address': '222 Elm Drive',
                'city': 'University Town',
                'state': 'CA',
                'zip_code': '90214',
                'distance_to_campus': 0.4,
                'rent_price': '700.00',
                'bedrooms': 1,
                'bathrooms': 1,
                'sq_ft': 200,
                'lease_type': 'semester',
                'furnished': True,
                'pets_allowed': False,
                'parking': False,
                'laundry': True,
                'wifi_included': True,
                'ac': True,
                'utilities_included': True,
            },
            {
                'title': 'Furnished 2BR - Semester Sublease',
                'description': 'Looking for someone to take over my lease for the spring semester. Fully furnished 2-bedroom apartment. Includes all furniture, kitchen essentials, and WiFi. Right across from the engineering building. Great deal!',
                'housing_type': 'apartment',
                'address': '333 University Blvd, Apt 12B',
                'city': 'University Town',
                'state': 'CA',
                'zip_code': '90215',
                'distance_to_campus': 0.1,
                'rent_price': '1100.00',
                'bedrooms': 2,
                'bathrooms': 1,
                'sq_ft': 750,
                'lease_type': 'sublease',
                'furnished': True,
                'pets_allowed': False,
                'parking': True,
                'laundry': False,
                'wifi_included': True,
                'ac': True,
                'utilities_included': False,
            },
            {
                'title': 'Charming Townhouse - Pet Friendly',
                'description': 'Beautiful 2-story townhouse with private patio. Open floor plan, lots of natural light. Pet-friendly with a fenced yard area. Close to parks and walking trails. 2 bedrooms upstairs, half bath on main floor.',
                'housing_type': 'townhouse',
                'address': '444 Maple Court',
                'city': 'University Town',
                'state': 'CA',
                'zip_code': '90216',
                'distance_to_campus': 1.5,
                'rent_price': '1800.00',
                'bedrooms': 2,
                'bathrooms': 2,
                'sq_ft': 1100,
                'lease_type': 'yearly',
                'furnished': False,
                'pets_allowed': True,
                'parking': True,
                'laundry': True,
                'wifi_included': False,
                'ac': True,
                'utilities_included': False,
            },
            {
                'title': 'Budget-Friendly Shared Room',
                'description': 'Shared room in a 3-bedroom apartment. Ideal for students looking to save money. Friendly roommates who are all engineering students. Common areas are clean and well-maintained. Includes all utilities and WiFi.',
                'housing_type': 'shared_room',
                'address': '555 Pine Street, Unit 8',
                'city': 'University Town',
                'state': 'CA',
                'zip_code': '90217',
                'distance_to_campus': 0.6,
                'rent_price': '450.00',
                'bedrooms': 1,
                'bathrooms': 1,
                'sq_ft': 150,
                'lease_type': 'monthly',
                'furnished': True,
                'pets_allowed': False,
                'parking': False,
                'laundry': True,
                'wifi_included': True,
                'ac': False,
                'utilities_included': True,
            },
            {
                'title': 'Luxury 2BR with Campus Views',
                'description': 'Top-floor apartment with stunning views of campus and the mountains. Premium finishes throughout - quartz counters, hardwood floors, modern fixtures. Building has rooftop terrace, fitness center, and study lounge.',
                'housing_type': 'apartment',
                'address': '777 Vista Drive, Unit 1201',
                'city': 'University Town',
                'state': 'CA',
                'zip_code': '90218',
                'distance_to_campus': 0.7,
                'rent_price': '2000.00',
                'bedrooms': 2,
                'bathrooms': 2,
                'sq_ft': 950,
                'lease_type': 'yearly',
                'furnished': False,
                'pets_allowed': True,
                'parking': True,
                'laundry': True,
                'wifi_included': True,
                'ac': True,
                'utilities_included': False,
            },
            {
                'title': 'Quiet Studio Near Library',
                'description': 'Perfect for focused students. This quiet studio is steps away from the main library and science buildings. Includes a small kitchenette, full bathroom, and built-in desk area. Month-to-month lease available.',
                'housing_type': 'studio',
                'address': '888 Scholar Way',
                'city': 'University Town',
                'state': 'CA',
                'zip_code': '90219',
                'distance_to_campus': 0.2,
                'rent_price': '850.00',
                'bedrooms': 1,
                'bathrooms': 1,
                'sq_ft': 350,
                'lease_type': 'monthly',
                'furnished': True,
                'pets_allowed': False,
                'parking': False,
                'laundry': False,
                'wifi_included': True,
                'ac': True,
                'utilities_included': True,
            },
            {
                'title': '4BR House - Great for Groups',
                'description': 'Perfect house for a group of 4 friends. Each bedroom is generously sized. Two full bathrooms, large living room, eat-in kitchen. Big driveway with space for 3 cars. Washer/dryer included. Only 15 min bike ride to campus.',
                'housing_type': 'house',
                'address': '999 Birch Lane',
                'city': 'University Town',
                'state': 'CA',
                'zip_code': '90220',
                'distance_to_campus': 2.0,
                'rent_price': '2800.00',
                'bedrooms': 4,
                'bathrooms': 2,
                'sq_ft': 1800,
                'lease_type': 'yearly',
                'furnished': False,
                'pets_allowed': True,
                'parking': True,
                'laundry': True,
                'wifi_included': False,
                'ac': True,
                'utilities_included': False,
            },
            {
                'title': 'Renovated 1BR - Walk to Class',
                'description': 'Just renovated! New flooring, paint, and kitchen appliances. This bright 1-bedroom is literally across the street from the main campus gate. Ideal for anyone who hates commuting. Secure building with keycard entry.',
                'housing_type': 'apartment',
                'address': '100 Campus Gateway',
                'city': 'University Town',
                'state': 'CA',
                'zip_code': '90221',
                'distance_to_campus': 0.05,
                'rent_price': '1250.00',
                'bedrooms': 1,
                'bathrooms': 1,
                'sq_ft': 550,
                'lease_type': 'yearly',
                'furnished': False,
                'pets_allowed': False,
                'parking': False,
                'laundry': True,
                'wifi_included': False,
                'ac': True,
                'utilities_included': False,
            },
        ]

        count = 0
        today = date.today()
        for data in listings_data:
            poster = random.choice(users)
            title = data.pop('title')
            desc = data.pop('description')
            _, created = HousingListing.objects.get_or_create(
                title=title,
                defaults={
                    'posted_by': poster,
                    'description': desc,
                    'rent_price': Decimal(data.pop('rent_price')),
                    'available_from': today + timedelta(days=random.randint(7, 90)),
                    'available_to': today + timedelta(days=random.randint(180, 365)),
                    'is_available': random.random() > 0.1,  # 90% available
                    **data,
                }
            )
            if created:
                count += 1
        self.stdout.write(f'  Created {count} housing listings')

    def _create_study_groups(self, users):
        self.stdout.write('Creating study groups...')

        groups_data = [
            {
                'name': 'CS 201 - Data Structures Study Group',
                'course_code': 'CS201',
                'subject_area': 'Computer Science',
                'description': 'Weekly study group for CS 201 Data Structures. We review lecture material, work through problem sets together, and prep for exams. All skill levels welcome!',
                'max_members': 8,
                'meeting_location': 'Library Room 302',
                'meeting_schedule': 'Tuesday & Thursday 6-8 PM',
                'meeting_frequency': 'weekly',
                'is_online': False,
            },
            {
                'name': 'Calculus II Problem Solving',
                'course_code': 'MATH202',
                'subject_area': 'Mathematics',
                'description': 'Struggling with integrals and series? Join us! We work through practice problems, share notes, and help each other understand tricky concepts in Calc II.',
                'max_members': 10,
                'meeting_location': 'Math Building Room 105',
                'meeting_schedule': 'Monday & Wednesday 4-5:30 PM',
                'meeting_frequency': 'weekly',
                'is_online': False,
            },
            {
                'name': 'Organic Chemistry Survival Group',
                'course_code': 'CHEM301',
                'subject_area': 'Chemistry',
                'description': 'Orgo is tough but we can get through it together! We focus on reaction mechanisms, practice synthesis problems, and share study strategies. Exam prep sessions before midterms and finals.',
                'max_members': 6,
                'meeting_location': '',
                'meeting_schedule': 'Sundays 2-5 PM',
                'meeting_frequency': 'weekly',
                'is_online': True,
                'meeting_link': 'https://zoom.us/j/example1',
            },
            {
                'name': 'Machine Learning Reading Group',
                'course_code': 'CS485',
                'subject_area': 'Computer Science',
                'description': 'Advanced reading group focused on current ML research papers. Each week a member presents a paper and we discuss its implications, methodology, and potential applications.',
                'max_members': 12,
                'meeting_location': 'Engineering Lab 210',
                'meeting_schedule': 'Friday 3-5 PM',
                'meeting_frequency': 'weekly',
                'is_online': False,
            },
            {
                'name': 'Biology 101 Study Circle',
                'course_code': 'BIO101',
                'subject_area': 'Biology',
                'description': 'Casual study group for intro biology. We make flashcards together, quiz each other, and review diagrams. Perfect for freshmen who want a supportive study environment.',
                'max_members': 15,
                'meeting_location': 'Student Center Room B',
                'meeting_schedule': 'Wednesday 7-9 PM',
                'meeting_frequency': 'weekly',
                'is_online': False,
            },
            {
                'name': 'Physics Problem Workshop',
                'course_code': 'PHYS201',
                'subject_area': 'Physics',
                'description': 'Hands-on problem-solving workshop for Physics 201. We tackle homework problems, work through derivations, and build intuition for mechanics and thermodynamics concepts.',
                'max_members': 8,
                'meeting_location': 'Physics Building Room 110',
                'meeting_schedule': 'Tuesday 5-7 PM',
                'meeting_frequency': 'weekly',
                'is_online': False,
            },
            {
                'name': 'GRE Prep Study Team',
                'course_code': '',
                'subject_area': 'Test Preparation',
                'description': 'Preparing for the GRE? Join our study team! We share resources, practice verbal and quant sections together, and keep each other accountable. Both general and subject GRE prep.',
                'max_members': 10,
                'meeting_location': '',
                'meeting_schedule': 'Saturday 10 AM - 12 PM',
                'meeting_frequency': 'weekly',
                'is_online': True,
                'meeting_link': 'https://zoom.us/j/example2',
            },
            {
                'name': 'Intro to Psychology Discussion',
                'course_code': 'PSY101',
                'subject_area': 'Psychology',
                'description': 'Discussion-based study group where we dive deeper into psychology topics covered in class. We also practice writing essay answers and analyzing case studies.',
                'max_members': 10,
                'meeting_location': 'Psychology Building Lounge',
                'meeting_schedule': 'Thursday 4-6 PM',
                'meeting_frequency': 'weekly',
                'is_online': False,
            },
            {
                'name': 'Economics Study Collective',
                'course_code': 'ECON301',
                'subject_area': 'Economics',
                'description': 'Intermediate micro and macroeconomics study group. We work through graphs, models, and problem sets. Special sessions before exams with past exam problems.',
                'max_members': 8,
                'meeting_location': 'Business School Room 401',
                'meeting_schedule': 'Monday & Thursday 5-6:30 PM',
                'meeting_frequency': 'biweekly',
                'is_online': False,
            },
            {
                'name': 'Creative Writing Workshop',
                'course_code': 'ENG220',
                'subject_area': 'English',
                'description': 'Share your creative writing and get constructive feedback! We cover short fiction, poetry, and creative non-fiction. Supportive and encouraging environment for all skill levels.',
                'max_members': 8,
                'meeting_location': 'Humanities Building Room 205',
                'meeting_schedule': 'Wednesday 6-8 PM',
                'meeting_frequency': 'biweekly',
                'is_online': False,
            },
            {
                'name': 'Linear Algebra Help Sessions',
                'course_code': 'MATH301',
                'subject_area': 'Mathematics',
                'description': 'Need help with eigenvalues, vector spaces, or matrix operations? This group focuses on building strong foundations in linear algebra through collaborative problem solving.',
                'max_members': 10,
                'meeting_location': '',
                'meeting_schedule': 'As needed before assignments',
                'meeting_frequency': 'as_needed',
                'is_online': True,
                'meeting_link': 'https://discord.gg/example3',
            },
            {
                'name': 'Spanish Conversation Practice',
                'course_code': 'SPAN201',
                'subject_area': 'Foreign Languages',
                'description': 'Practice speaking Spanish in a relaxed, judgment-free environment! We play games, discuss topics, and help each other improve fluency. Native speakers and beginners all welcome.',
                'max_members': 12,
                'meeting_location': 'Language Lab Room 102',
                'meeting_schedule': 'Friday 12-1 PM',
                'meeting_frequency': 'weekly',
                'is_online': False,
            },
        ]

        count = 0
        for data in groups_data:
            creator = random.choice(users)
            name = data.pop('name')
            group, created = StudyGroup.objects.get_or_create(
                name=name,
                defaults={
                    'creator': creator,
                    **data,
                }
            )
            if created:
                count += 1
                # Add creator as admin
                GroupMembership.objects.get_or_create(
                    group=group, user=creator,
                    defaults={'role': 'admin'}
                )
                # Add random members
                other_users = [u for u in users if u != creator]
                member_count = random.randint(2, min(data.get('max_members', 10) - 1, len(other_users)))
                for member_user in random.sample(other_users, member_count):
                    GroupMembership.objects.get_or_create(
                        group=group, user=member_user,
                        defaults={'role': 'member'}
                    )

        self.stdout.write(f'  Created {count} study groups with members')
