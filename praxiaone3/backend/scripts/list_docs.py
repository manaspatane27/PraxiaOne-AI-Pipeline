#!/usr/bin/env python
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'praxiaone.settings')
import django
django.setup()
from core.models import UploadedDocument
print('count', UploadedDocument.objects.count())
for doc in UploadedDocument.objects.all():
    print(doc.id, doc.title, doc.doc_type, doc.file.name, doc.uploaded_at)
