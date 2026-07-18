from celery import shared_task


@shared_task
def complete_flight(flight_log_id: int):
    """
    Celery task: fires at the scheduled arrival time.
    Delegates the entire arrival logic to TravelController.complete_flight()
    which runs atomically (city update, chat room swap, cooldown set).
    """
    from ooe.travel.controllers import TravelController
    TravelController.complete_flight(flight_log_id)
