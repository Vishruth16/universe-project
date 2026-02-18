from rest_framework import serializers
from .models import HousingListing, HousingImage, HousingInquiry


class HousingImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = HousingImage
        fields = ['id', 'image']


class HousingListingSerializer(serializers.ModelSerializer):
    images = HousingImageSerializer(many=True, read_only=True)
    posted_by_username = serializers.SerializerMethodField()

    class Meta:
        model = HousingListing
        fields = '__all__'
        read_only_fields = ['posted_by']

    def get_posted_by_username(self, obj):
        return obj.posted_by.username

    def create(self, validated_data):
        validated_data['posted_by'] = self.context['request'].user
        return super().create(validated_data)


class HousingInquirySerializer(serializers.ModelSerializer):
    sender_username = serializers.SerializerMethodField()
    receiver_username = serializers.SerializerMethodField()

    class Meta:
        model = HousingInquiry
        fields = '__all__'
        read_only_fields = ['sender']

    def get_sender_username(self, obj):
        return obj.sender.username

    def get_receiver_username(self, obj):
        return obj.receiver.username

    def create(self, validated_data):
        validated_data['sender'] = self.context['request'].user
        return super().create(validated_data)
