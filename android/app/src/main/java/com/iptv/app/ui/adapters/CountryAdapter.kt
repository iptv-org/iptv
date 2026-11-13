package com.iptv.app.ui.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.iptv.app.R
import com.iptv.app.network.CountryInfo
import com.iptv.app.databinding.ItemCountryBinding

class CountryAdapter(
    private val onCountryClick: (CountryInfo) -> Unit
) : RecyclerView.Adapter<CountryAdapter.ViewHolder>() {

    private val items = mutableListOf<CountryInfo>()

    fun submitList(list: List<CountryInfo>) {
        items.clear()
        items.addAll(list)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemCountryBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(items[position], holder.itemView.context)
    }

    override fun getItemCount(): Int = items.size

    inner class ViewHolder(private val binding: ItemCountryBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(item: CountryInfo, context: android.content.Context) {
            binding.name.text = item.name
            if (item.channelCount > 0) {
                binding.count.text = "${item.channelCount} ${context.getString(R.string.subtitle_channels_count)}"
            } else {
                binding.count.text = context.getString(R.string.subtitle_channels_count)
            }
            binding.flag.text = flagEmoji(item.code)
            binding.root.setOnClickListener { onCountryClick(item) }
        }

        private fun flagEmoji(code: String): String {
            if (code.length >= 2) {
                val c1 = Character.codePointAt(code, 0)
                val upper = code.uppercase()
                val cp1 = upper.first().code - 'A'.code + 0x1F1E6
                val cp2 = upper.last().code - 'A'.code + 0x1F1E6
                return String(Character.toChars(cp1)) + String(Character.toChars(cp2))
            }
            return "🏳"
        }
    }
}
