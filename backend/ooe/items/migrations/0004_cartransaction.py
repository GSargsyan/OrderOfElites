from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('cities', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('items', '0003_userairplane'),
    ]

    operations = [
        migrations.CreateModel(
            name='CarTransaction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('car', models.CharField(max_length=50)),
                ('action', models.CharField(choices=[('buy', 'Buy'), ('sell', 'Sell')], max_length=4)),
                ('price', models.BigIntegerField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('city', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='car_transactions', to='cities.city')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='car_transactions', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'ooe_car_transactions',
            },
        ),
    ]
