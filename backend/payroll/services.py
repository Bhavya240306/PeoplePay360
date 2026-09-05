from simpleeval import simple_eval

def evaluate_rule(rule, context):
    """
    Resolves a single SalaryRule's value given the current context
    (a dict of already-computed rule codes -> values, e.g. {"BASIC": 30000}).
    Returns a float.
    """
    if rule.computation_type == "fixed":
        return float(rule.amount)

    elif rule.computation_type == "percentage":
        base_value = context.get(rule.percentage_of_code)
        if base_value is None:
            raise ValueError(f"'{rule.percentage_of_code}' not found in context for rule '{rule.code}'")
        return float(base_value) * float(rule.percentage) / 100

    elif rule.computation_type == "formula":
        # simple_eval is a SANDBOXED evaluator — it can only do basic
        # math using the variables we hand it via `names`. It cannot
        # import modules, call functions, or access the filesystem —
        # unlike raw eval(), which we NEVER use here.
        return simple_eval(rule.formula, names=context)

    raise ValueError(f"Unknown computation_type '{rule.computation_type}' on rule '{rule.code}'")


def compute_structure(structure, base_context):
    """
    Runs every rule in a SalaryStructure, in sequence order, building up
    context as it goes. Returns a list of line items, each with the
    resolved value, ready to become PayslipLine rows later in Phase D.
    """
    context = dict(base_context)  # don't mutate the caller's dict
    line_items = []

    for rule in structure.ordered_rules():
        value = evaluate_rule(rule, context)
        context[rule.code] = value  # make this rule's result available to later rules
        line_items.append({
            "rule_code": rule.code,
            "rule_name": rule.name,
            "category": rule.category,
            "sequence": rule.sequence,
            "amount": round(value, 2),
        })

    return line_items