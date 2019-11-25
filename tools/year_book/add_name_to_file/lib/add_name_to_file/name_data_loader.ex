defmodule AddNameToFile.NameDataLoader do
  @student_id_key "Student ID"
  @english_first_name_key "First Name"
  @english_last_name_key "Last Name"
  @chinese_name_key "Chinese Name"

  def load(data_file_path) do
    File.stream!(data_file_path, encoding: :utf8)
    |> CSV.decode!(headers: true)
    |> Map.new(fn x -> {x[@student_id_key], record_to_name_string(x)} end)
  end

  def record_to_name_string(name_data_map) do
    "#{name_data_map[@student_id_key]}_#{name_data_map[@english_first_name_key]}_#{
      name_data_map[@english_last_name_key]
    }_#{name_data_map[@chinese_name_key]}"
  end
end