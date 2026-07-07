from django.urls import path
from .views import (
    get_tab_data,
    buy_precursor,
    assign_professional,
    remove_professional,
    withdraw_money,
)

urlpatterns = [
    path('api/black_market/get_tab_data', get_tab_data, name='bm_get_tab_data'),
    path('api/black_market/buy_precursor', buy_precursor, name='bm_buy_precursor'),
    path('api/black_market/assign_professional', assign_professional, name='bm_assign_professional'),
    path('api/black_market/remove_professional', remove_professional, name='bm_remove_professional'),
    path('api/black_market/withdraw', withdraw_money, name='bm_withdraw_money'),
]
