import os
import random
from io import BytesIO
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.conf import settings
from user_profiles.models import UserProfile

try:
    from PIL import Image, ImageDraw, ImageFont
    HAS_PIL = True
except ImportError:
    HAS_PIL = False


COLORS = [
    ('#4F46E5', '#818CF8'),  # Indigo
    ('#7C3AED', '#A78BFA'),  # Violet
    ('#EC4899', '#F472B6'),  # Pink
    ('#10B981', '#34D399'),  # Emerald
    ('#3B82F6', '#60A5FA'),  # Blue
    ('#F59E0B', '#FBBF24'),  # Amber
    ('#EF4444', '#F87171'),  # Red
    ('#06B6D4', '#22D3EE'),  # Cyan
    ('#8B5CF6', '#A78BFA'),  # Purple
    ('#14B8A6', '#2DD4BF'),  # Teal
    ('#F97316', '#FB923C'),  # Orange
    ('#6366F1', '#818CF8'),  # Indigo alt
    ('#D946EF', '#E879F9'),  # Fuchsia
    ('#0EA5E9', '#38BDF8'),  # Sky
    ('#84CC16', '#A3E635'),  # Lime
]


def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


class Command(BaseCommand):
    help = 'Generate profile avatar images for all users'

    def handle(self, *args, **options):
        if not HAS_PIL:
            self.stderr.write('Pillow is required. pip install Pillow')
            return

        media_dir = os.path.join(settings.MEDIA_ROOT, 'profile_pics')
        os.makedirs(media_dir, exist_ok=True)

        profiles = UserProfile.objects.select_related('user').all()
        count = 0

        for i, profile in enumerate(profiles):
            first = profile.first_name or profile.user.first_name or ''
            last = profile.last_name or profile.user.last_name or ''
            initials = f'{first[:1]}{last[:1]}'.upper() or 'U'

            bg_color, accent_color = COLORS[i % len(COLORS)]
            bg_rgb = hex_to_rgb(bg_color)
            accent_rgb = hex_to_rgb(accent_color)

            # Create 400x400 avatar with gradient-like effect
            size = 400
            img = Image.new('RGB', (size, size), bg_rgb)
            draw = ImageDraw.Draw(img)

            # Draw a large circle background
            circle_center = (size // 2, size // 2)
            for r in range(size // 2, 0, -1):
                # Blend from bg to accent from edge to center
                t = 1 - (r / (size // 2))
                color = tuple(int(bg_rgb[j] + t * (accent_rgb[j] - bg_rgb[j])) for j in range(3))
                draw.ellipse(
                    [circle_center[0] - r, circle_center[1] - r,
                     circle_center[0] + r, circle_center[1] + r],
                    fill=color
                )

            # Draw initials
            try:
                font = ImageFont.truetype("arial.ttf", 140)
            except (OSError, IOError):
                try:
                    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 140)
                except (OSError, IOError):
                    font = ImageFont.load_default()

            bbox = draw.textbbox((0, 0), initials, font=font)
            text_w = bbox[2] - bbox[0]
            text_h = bbox[3] - bbox[1]
            text_x = (size - text_w) // 2
            text_y = (size - text_h) // 2 - 15

            # White text with slight shadow
            draw.text((text_x + 2, text_y + 2), initials, fill=(0, 0, 0, 40), font=font)
            draw.text((text_x, text_y), initials, fill=(255, 255, 255), font=font)

            # Save
            buffer = BytesIO()
            img.save(buffer, format='PNG', quality=95)
            buffer.seek(0)

            filename = f'avatar_{profile.user.username}.png'
            profile.profile_picture.save(filename, ContentFile(buffer.read()), save=True)
            count += 1
            self.stdout.write(f'  Generated avatar for {profile.user.username}')

        self.stdout.write(self.style.SUCCESS(f'\nGenerated {count} profile photos.'))
