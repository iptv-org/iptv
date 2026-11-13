package com.iptv.app.models

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * A single IPTV channel parsed from an M3U playlist.
 */
data class Channel(
    val title: String,
    val url: String,
    val tvgId: String = "",
    val groupTitle: String = "",
    val resolution: String = "",
    val countryCode: String = "",
    val category: String = "",
    val logo: String = ""
) {
    /** Friendly resolution label, e.g. "720p", "1080p", or "SD". */
    val resolutionLabel: String
        get() = if (resolution.isNotBlank()) resolution else "SD"

    override fun toString(): String = title
}

/**
 * Room entity for favorite channels stored locally.
 */
@Entity(tableName = "favorites")
data class FavoriteChannel(
    @PrimaryKey val url: String,
    val title: String,
    val groupTitle: String = "",
    val countryCode: String = "",
    val category: String = "",
    val addedAt: Long = System.currentTimeMillis()
) {
    fun toChannel(): Channel =
        Channel(
            title = title,
            url = url,
            groupTitle = groupTitle,
            countryCode = countryCode,
            category = category
        )
}
