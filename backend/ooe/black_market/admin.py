from django.contrib import admin
from ooe.black_market.models import PlayerDrugState, Professional, SaleRecord, DrugPrice


@admin.register(PlayerDrugState)
class PlayerDrugStateAdmin(admin.ModelAdmin):
    list_display = ('user', 'city', 'drug_type', 'precursor_qty', 'pending_money')
    list_filter = ('drug_type', 'city')


@admin.register(Professional)
class ProfessionalAdmin(admin.ModelAdmin):
    list_display = ('player_drug_state', 'role', 'is_trained', 'trained_at')
    list_filter = ('role', 'is_trained')


@admin.register(SaleRecord)
class SaleRecordAdmin(admin.ModelAdmin):
    list_display = ('city', 'drug_type', 'quantity', 'recorded_at')
    list_filter = ('drug_type', 'city')


@admin.register(DrugPrice)
class DrugPriceAdmin(admin.ModelAdmin):
    list_display = ('city', 'drug_type', 'price', 'updated_at')
    list_filter = ('drug_type', 'city')
