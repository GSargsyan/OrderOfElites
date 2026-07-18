import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('cities', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='FlightLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('airplane', models.CharField(max_length=50)),
                ('cost', models.IntegerField()),
                ('departed_at', models.DateTimeField()),
                ('arrival_time', models.DateTimeField()),
                ('arrived_at', models.DateTimeField(blank=True, null=True)),
                ('cooldown_until', models.DateTimeField(blank=True, null=True)),
                ('destination_city', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='arrivals',
                    to='cities.city',
                )),
                ('origin_city', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='departures',
                    to='cities.city',
                )),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='flights',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'db_table': 'ooe_flight_log',
                'ordering': ['-departed_at'],
            },
        ),
    ]
