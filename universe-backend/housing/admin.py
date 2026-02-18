from django.contrib import admin
from .models import HousingListing, HousingImage, HousingInquiry


@admin.register(HousingListing)
class HousingListingAdmin(admin.ModelAdmin):
    list_display = ['title', 'housing_type', 'rent_price', 'city', 'bedrooms', 'is_available', 'posted_date']
    list_filter = ['housing_type', 'is_available', 'furnished', 'pets_allowed']
    search_fields = ['title', 'description', 'address', 'city']


@admin.register(HousingImage)
class HousingImageAdmin(admin.ModelAdmin):
    list_display = ['listing', 'image']


@admin.register(HousingInquiry)
class HousingInquiryAdmin(admin.ModelAdmin):
    list_display = ['listing', 'sender', 'receiver', 'timestamp', 'is_read']
    list_filter = ['is_read']
