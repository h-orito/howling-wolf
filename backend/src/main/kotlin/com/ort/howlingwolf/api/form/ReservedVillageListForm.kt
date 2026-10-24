package com.ort.howlingwolf.api.form

import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min

data class ReservedVillageListForm(
    @field:Min(1)
    @field:Max(10)
    val limit: Int?
) {
    constructor() : this(null)
}
