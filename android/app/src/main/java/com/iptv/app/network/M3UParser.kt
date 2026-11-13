package com.iptv.app.network

import com.iptv.app.models.Channel
import java.net.URLDecoder

/**
 * Parses an Extended M3U (M3U8) playlist into a list of [Channel].
 *
 * Example entry:
 * #EXTINF:-1 tvg-id="..." tvg-logo="..." group-title="News",Channel Name (720p)
 * https://example.com/stream.m3u8
 */
object M3UParser {

    private const val EXTINF = "#EXTINF"
    private const val GROUP_TITLE = "group-title="
    private const val TVG_ID = "tvg-id="
    private const val TVG_LOGO = "tvg-logo="

    fun parse(content: String, defaultCountry: String = "", defaultCategory: String = ""): List<Channel> {
        val channels = mutableListOf<Channel>()
        val lines = content.split("\n")

        var currentTitle = ""
        var currentTvgId = ""
        var currentGroup = ""
        var currentLogo = ""
        var currentResolution = ""

        for (raw in lines) {
            val line = raw.trim()

            if (line.isEmpty() || line.startsWith("#EXTM3U")) continue

            if (line.startsWith(EXTINF)) {
                // Extract attributes and title after the last comma
                val attrsAndTitle = line.substringAfter(":", "")
                val commaIndex = attrsAndTitle.lastIndexOf(',')
                if (commaIndex >= 0) {
                    val attrStr = attrsAndTitle.substring(0, commaIndex).trim()
                    currentTitle = attrsAndTitle.substring(commaIndex + 1).trim()
                } else {
                    currentTitle = attrsAndTitle.trim()
                }

                currentTvgId = extractAttr(attrStr, TVG_ID)
                currentLogo = extractAttr(attrStr, TVG_LOGO)
                currentGroup = extractAttr(attrStr, GROUP_TITLE)
                currentResolution = extractResolution(currentTitle)
                continue
            }

            if (line.startsWith("#")) {
                // Other directives (#EXTGRP, etc.) — ignore
                continue
            }

            // This line is a URL — pair it with the last EXTINF metadata
            if (line.isNotBlank() && currentTitle.isNotBlank()) {
                channels.add(
                    Channel(
                        title = currentTitle,
                        url = line,
                        tvgId = currentTvgId,
                        groupTitle = currentGroup,
                        resolution = currentResolution,
                        countryCode = defaultCountry,
                        category = defaultCategory,
                        logo = currentLogo
                    )
                )
                // Reset for next entry
                currentTitle = ""
                currentTvgId = ""
                currentGroup = ""
                currentLogo = ""
                currentResolution = ""
            }
        }

        return channels
    }

    private fun extractAttr(attrStr: String, key: String): String {
        val idx = attrStr.indexOf(key, ignoreCase = true)
        if (idx < 0) return ""
        val start = idx + key.length
        var value = ""
        if (start < attrStr.length && attrStr[start] == '"') {
            val end = attrStr.indexOf('"', start + 1)
            if (end > start) {
                value = attrStr.substring(start + 1, end)
            }
        } else {
            // unquoted value up to next space or end
            val end = attrStr.indexOf(' ', start)
            value = if (end < 0) attrStr.substring(start) else attrStr.substring(start, end)
        }
        return URLDecoder.decode(value, "UTF-8").trim()
    }

    /** Try to read a resolution hint like "(720p)" from the channel title. */
    private fun extractResolution(title: String): String {
        val regex = Regex("\\((\\d{3,4}p)\\)")
        val match = regex.find(title)
        return match?.groupValues?.get(1) ?: ""
    }
}
