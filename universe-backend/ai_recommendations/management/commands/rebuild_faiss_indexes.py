from django.core.management.base import BaseCommand
from ai_recommendations import embeddings as emb
from ai_recommendations import faiss_service
from ai_recommendations.text_builders import (
    build_housing_listing_text,
    build_marketplace_item_text,
    build_study_group_text,
    build_user_profile_text,
)


class Command(BaseCommand):
    help = 'Rebuild FAISS indexes for AI recommendations'

    def add_arguments(self, parser):
        parser.add_argument(
            '--index',
            type=str,
            choices=['housing', 'marketplace', 'study_groups', 'roommate', 'all'],
            default='all',
            help='Which index to rebuild (default: all)',
        )

    def handle(self, *args, **options):
        index_name = options['index']

        if index_name in ('housing', 'all'):
            self._build_housing_index()

        if index_name in ('marketplace', 'all'):
            self._build_marketplace_index()

        if index_name in ('study_groups', 'all'):
            self._build_study_groups_index()

        if index_name in ('roommate', 'all'):
            self._build_roommate_index()

        faiss_service.invalidate_cache()
        self.stdout.write(self.style.SUCCESS('FAISS indexes rebuilt successfully.'))

    def _build_housing_index(self):
        from housing.models import HousingListing

        listings = HousingListing.objects.filter(is_available=True)
        if not listings.exists():
            self.stdout.write('No housing listings found. Skipping.')
            return

        texts = [build_housing_listing_text(l) for l in listings]
        ids = [l.id for l in listings]
        embeddings = emb.embed_texts(texts)
        faiss_service.build_index('housing', embeddings, ids)
        self.stdout.write(f'Housing index built with {len(ids)} entries.')

    def _build_marketplace_index(self):
        from marketplace.models import MarketplaceItem

        items = MarketplaceItem.objects.filter(is_sold=False)
        if not items.exists():
            self.stdout.write('No marketplace items found. Skipping.')
            return

        texts = [build_marketplace_item_text(i) for i in items]
        ids = [i.id for i in items]
        embeddings = emb.embed_texts(texts)
        faiss_service.build_index('marketplace', embeddings, ids)
        self.stdout.write(f'Marketplace index built with {len(ids)} entries.')

    def _build_study_groups_index(self):
        from study_groups.models import StudyGroup

        groups = StudyGroup.objects.filter(is_active=True)
        if not groups.exists():
            self.stdout.write('No study groups found. Skipping.')
            return

        texts = [build_study_group_text(g) for g in groups]
        ids = [g.id for g in groups]
        embeddings = emb.embed_texts(texts)
        faiss_service.build_index('study_groups', embeddings, ids)
        self.stdout.write(f'Study groups index built with {len(ids)} entries.')

    def _build_roommate_index(self):
        from user_profiles.models import UserProfile

        profiles = UserProfile.objects.all()
        if not profiles.exists():
            self.stdout.write('No user profiles found. Skipping.')
            return

        texts = []
        ids = []
        for profile in profiles:
            roommate_profile = getattr(profile, 'roommateprofile', None)
            text = build_user_profile_text(profile, roommate_profile)
            texts.append(text)
            ids.append(profile.user.id)

        embeddings = emb.embed_texts(texts)
        faiss_service.build_index('roommate', embeddings, ids)
        self.stdout.write(f'Roommate index built with {len(ids)} entries.')
