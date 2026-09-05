from django.test import TestCase
from .models import SalaryRule, SalaryStructure
from .services import compute_structure


class ComputeStructureTests(TestCase):
    def setUp(self):
        self.basic = SalaryRule.objects.create(
            code="BASIC", name="Basic Wage", category="basic",
            sequence=10, computation_type="fixed", amount=30000
        )
        self.hra = SalaryRule.objects.create(
            code="HRA", name="House Rent Allowance", category="allowance",
            sequence=20, computation_type="percentage", percentage=40, percentage_of_code="BASIC"
        )
        self.pf = SalaryRule.objects.create(
            code="PF", name="Provident Fund", category="deduction",
            sequence=30, computation_type="percentage", percentage=12, percentage_of_code="BASIC"
        )
        self.gross = SalaryRule.objects.create(
            code="GROSS", name="Gross Salary", category="gross",
            sequence=40, computation_type="formula", formula="BASIC + HRA"
        )
        self.net = SalaryRule.objects.create(
            code="NET", name="Net Salary", category="net",
            sequence=50, computation_type="formula", formula="GROSS - PF"
        )
        self.structure = SalaryStructure.objects.create(name="Regular Salary")
        self.structure.rules.set([self.basic, self.hra, self.pf, self.gross, self.net])

    def test_compute_structure_resolves_correct_values(self):
        result = compute_structure(self.structure, base_context={})
        values = {line["rule_code"]: line["amount"] for line in result}

        self.assertEqual(values["BASIC"], 30000.0)
        self.assertEqual(values["HRA"], 12000.0)
        self.assertEqual(values["PF"], 3600.0)
        self.assertEqual(values["GROSS"], 42000.0)
        self.assertEqual(values["NET"], 38400.0)