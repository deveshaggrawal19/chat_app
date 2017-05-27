from django.db import models

# Create your models here.
from django.contrib.auth.models import User

class Comments(models.Model):
    user = models.ForeignKey(User)
    text = models.CharField(max_length=255, null=True)
