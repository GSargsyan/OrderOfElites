from django.db import models


class PlayerDrugState(models.Model):
    """
    Core table: one row per (player, drug_type, city) combination.
    Stores accumulated quantities for each step of the production chain.

    Alcohol uses: precursor_qty → intermediate_1_qty → stash_qty
    Cannabis uses: precursor_qty → intermediate_1_qty → intermediate_2_qty → stash_qty
    Meth/Coke (future) would use intermediate_3_qty as well.
    """
    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='drug_states'
    )
    city = models.ForeignKey(
        'cities.City',
        on_delete=models.CASCADE,
        related_name='drug_states'
    )
    drug_type = models.CharField(max_length=20)

    precursor_qty = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    intermediate_1_qty = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    intermediate_2_qty = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    intermediate_3_qty = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    stash_qty = models.DecimalField(max_digits=14, decimal_places=4, default=0)

    last_tick_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ooe_player_drug_state'
        unique_together = ('user', 'drug_type', 'city')


class Professional(models.Model):
    """
    One row per assigned professional.
    Individual rows (not counts) because each has its own training timer.
    """
    player_drug_state = models.ForeignKey(
        'PlayerDrugState',
        on_delete=models.CASCADE,
        related_name='professionals'
    )
    role = models.CharField(max_length=20)

    # When training completes. Set to now + TRAINING_TIME on creation.
    trained_at = models.DateTimeField()
    is_trained = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ooe_professionals'


class SaleRecord(models.Model):
    """
    Logs every sale tick for supply tracking.
    Used to compute 'S' (supply) in the pricing formula:
    total units sold in this city in the last SUPPLY_WINDOW_MINUTES.
    Old records are periodically pruned.
    """
    city = models.ForeignKey(
        'cities.City',
        on_delete=models.CASCADE,
        related_name='sale_records'
    )
    drug_type = models.CharField(max_length=20)
    quantity = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ooe_sale_records'
        indexes = [
            models.Index(fields=['city', 'drug_type', 'recorded_at']),
        ]


class DrugPrice(models.Model):
    """
    Cached current price per drug per city.
    Updated by the price tick Celery task.
    Stored in DB (not Redis) because prices are authoritative game state
    that must survive restarts and be queryable.
    """
    city = models.ForeignKey(
        'cities.City',
        on_delete=models.CASCADE,
        related_name='drug_prices'
    )
    drug_type = models.CharField(max_length=20)
    price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ooe_drug_prices'
        unique_together = ('city', 'drug_type')
