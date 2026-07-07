from django.core.management.base import BaseCommand
from ooe.black_market.models import PlayerDrugState, Professional, SaleRecord, DrugPrice

class Command(BaseCommand):
    help = 'Displays black market tables in a clear, formatted layout.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--limit',
            type=int,
            default=20,
            help='Limit the number of rows displayed for the SaleRecord table.'
        )

    def print_table(self, title, headers, rows):
        # Print Title with clean separator
        print(f"\n================================================================================")
        print(f" {title.upper()} ")
        print(f"================================================================================")
        
        if not rows:
            print("  (No data found)\n")
            return

        # Calculate column widths
        widths = [len(h) for h in headers]
        for row in rows:
            for idx, val in enumerate(row):
                widths[idx] = max(widths[idx], len(str(val)))

        # Print Header
        header_str = " | ".join(f"{str(h).ljust(widths[idx])}" for idx, h in enumerate(headers))
        print(header_str)
        print("-" * len(header_str))

        # Print Rows
        for row in rows:
            row_str = " | ".join(f"{str(val).ljust(widths[idx])}" for idx, val in enumerate(row))
            print(row_str)

        print(f"\nTotal: {len(rows)} row(s)\n")

    def handle(self, *args, **options):
        limit = options['limit']

        # 1. Player Drug State
        states = PlayerDrugState.objects.select_related('user', 'city').order_by('user__username', 'city__name', 'drug_type')
        state_headers = [
            "ID", "User", "City", "Drug Type", "Precursor", 
            "Intermediate 1", "Intermediate 2", "Intermediate 3", 
            "Pending Money", "Last Tick"
        ]
        state_rows = []
        for s in states:
            state_rows.append([
                s.id,
                s.user.username,
                s.city.name,
                s.drug_type,
                f"{s.precursor_qty:.4f}",
                f"{s.intermediate_1_qty:.4f}",
                f"{s.intermediate_2_qty:.4f}",
                f"{s.intermediate_3_qty:.4f}",
                f"${s.pending_money:.2f}",
                s.last_tick_at.strftime("%Y-%m-%d %H:%M:%S") if s.last_tick_at else "N/A"
            ])
        self.print_table("Player Drug State (ooe_player_drug_state)", state_headers, state_rows)

        # 2. Professionals
        professionals = Professional.objects.select_related(
            'player_drug_state__user', 
            'player_drug_state__city'
        ).order_by('player_drug_state__user__username', 'role')
        prof_headers = ["ID", "Player/City/Drug", "Role", "Is Trained", "Trained At", "Created At"]
        prof_rows = []
        for p in professionals:
            s = p.player_drug_state
            player_str = f"{s.user.username} ({s.city.name}) [{s.drug_type}]"
            prof_rows.append([
                p.id,
                player_str,
                p.role,
                "Yes" if p.is_trained else "No",
                p.trained_at.strftime("%Y-%m-%d %H:%M:%S") if p.trained_at else "N/A",
                p.created_at.strftime("%Y-%m-%d %H:%M:%S") if p.created_at else "N/A"
            ])
        self.print_table("Professionals (ooe_professionals)", prof_headers, prof_rows)

        # 3. Drug Prices
        prices = DrugPrice.objects.select_related('city').order_by('city__name', 'drug_type')
        price_headers = ["ID", "City", "Drug Type", "Current Price", "Updated At"]
        price_rows = []
        for p in prices:
            price_rows.append([
                p.id,
                p.city.name,
                p.drug_type,
                f"${p.price:.2f}",
                p.updated_at.strftime("%Y-%m-%d %H:%M:%S") if p.updated_at else "N/A"
            ])
        self.print_table("Drug Prices (ooe_drug_prices)", price_headers, price_rows)

        # 4. Sale Records (Limited)
        total_sales = SaleRecord.objects.count()
        sales = SaleRecord.objects.select_related('city').order_by('-recorded_at')[:limit]
        sale_headers = ["ID", "City", "Drug Type", "Quantity", "Recorded At"]
        sale_rows = []
        for s in sales:
            sale_rows.append([
                s.id,
                s.city.name,
                s.drug_type,
                f"{s.quantity:.4f}",
                s.recorded_at.strftime("%Y-%m-%d %H:%M:%S") if s.recorded_at else "N/A"
            ])
        self.print_table(
            f"Sale Records (ooe_sale_records) - Showing last {limit} of {total_sales}", 
            sale_headers, 
            sale_rows
        )
