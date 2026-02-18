from django.db import models
from django.contrib.auth.models import User


class HousingListing(models.Model):
    HOUSING_TYPE_CHOICES = [
        ('apartment', 'Apartment'),
        ('house', 'House'),
        ('condo', 'Condo'),
        ('townhouse', 'Townhouse'),
        ('studio', 'Studio'),
        ('room', 'Room'),
        ('shared_room', 'Shared Room'),
    ]

    LEASE_TYPE_CHOICES = [
        ('yearly', 'Yearly'),
        ('semester', 'Semester'),
        ('monthly', 'Monthly'),
        ('sublease', 'Sublease'),
    ]

    posted_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='housing_listings')
    title = models.CharField(max_length=200)
    description = models.TextField()
    housing_type = models.CharField(max_length=20, choices=HOUSING_TYPE_CHOICES)

    # Location
    address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=50)
    zip_code = models.CharField(max_length=10)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    distance_to_campus = models.FloatField(null=True, blank=True, help_text='Distance in miles')

    # Details
    rent_price = models.DecimalField(max_digits=10, decimal_places=2)
    bedrooms = models.IntegerField(default=1)
    bathrooms = models.IntegerField(default=1)
    sq_ft = models.IntegerField(null=True, blank=True)
    lease_type = models.CharField(max_length=20, choices=LEASE_TYPE_CHOICES, default='yearly')
    available_from = models.DateField(null=True, blank=True)
    available_to = models.DateField(null=True, blank=True)

    # Amenities (booleans)
    furnished = models.BooleanField(default=False)
    pets_allowed = models.BooleanField(default=False)
    parking = models.BooleanField(default=False)
    laundry = models.BooleanField(default=False)
    wifi_included = models.BooleanField(default=False)
    ac = models.BooleanField(default=False)
    utilities_included = models.BooleanField(default=False)
    amenities = models.TextField(blank=True, default='', help_text='Additional amenities')

    is_available = models.BooleanField(default=True)
    posted_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-posted_date']

    def __str__(self):
        return f"{self.title} - ${self.rent_price}/mo"


class HousingImage(models.Model):
    listing = models.ForeignKey(HousingListing, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='housing_images/')

    def __str__(self):
        return f"Image for {self.listing.title}"


class HousingInquiry(models.Model):
    listing = models.ForeignKey(HousingListing, on_delete=models.CASCADE, related_name='inquiries')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_housing_inquiries')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_housing_inquiries')
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"Inquiry from {self.sender.username} about {self.listing.title}"
