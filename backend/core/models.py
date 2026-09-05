from django.db import models


class Employee(models.Model):
    employee_id = models.CharField(max_length=20, unique=True)

    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50, blank=True)

    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15, blank=True)

    department = models.CharField(max_length=100, blank=True)
    job_title = models.CharField(max_length=100, blank=True)

    date_of_joining = models.DateField()
    bank_account = models.CharField(max_length=30, blank=True)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.employee_id} - {self.first_name} {self.last_name}"


class Contract(models.Model):
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="contracts"
    )

    contract_type = models.CharField(max_length=50)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)

    basic_salary = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    working_hours_per_week = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=40
    )

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.employee.employee_id} - {self.contract_type}"

class Attendance(models.Model):
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="attendance_records"
    )

    date = models.DateField()
    check_in = models.TimeField(null=True, blank=True)
    check_out = models.TimeField(null=True, blank=True)

    status = models.CharField(
        max_length=20,
        choices=[
            ("present", "Present"),
            ("absent", "Absent"),
            ("late", "Late"),
            ("half_day", "Half Day"),
        ],
        default="present"
    )

    worked_hours = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0
    )

    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("employee", "date")
        ordering = ["-date"]

    def __str__(self):
        return f"{self.employee.employee_id} - {self.date}"

class Schedule(models.Model):
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="schedules"
    )

    day_of_week = models.CharField(
        max_length=10,
        choices=[
            ("monday", "Monday"),
            ("tuesday", "Tuesday"),
            ("wednesday", "Wednesday"),
            ("thursday", "Thursday"),
            ("friday", "Friday"),
            ("saturday", "Saturday"),
            ("sunday", "Sunday"),
        ]
    )

    start_time = models.TimeField()
    end_time = models.TimeField()

    is_working_day = models.BooleanField(default=True)

    location = models.CharField(max_length=100, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("employee", "day_of_week")

    def __str__(self):
        return (
            f"{self.employee.employee_id} - "
            f"{self.day_of_week}"
        )