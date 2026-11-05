import { useState, useEffect } from "react"
import { useLang } from "@/i18n/LanguageContext"
import { deleteErrorMessage } from "@/lib/utils"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui"
import { useUserStore } from "../../context/userContext"
import { authContext } from "../../context/authContext"
import { usePageTitle } from "../../hooks/usePageTitle"
import { SimpleHeader, ConfirmModal } from "@/components/shared"
import { UserStats, UsersTable, UserFormDialog } from "@/components/admin/UserManagementParts"

export default function UserManagement() {
  const { t } = useLang()
  usePageTitle(t("nav.users"))
  const { users, fetchUsers, createUser, updateUser, deleteUser, isLoading } = useUserStore()
  const { user: currentUser } = authContext()

  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("All Role")
  const [addOpen, setAddOpen] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "" })
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    fetchUsers()
  }, [])

  const filtered = users.filter(u =>
    (roleFilter === "All Role" || u.role === roleFilter) &&
    (u.username.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
  )

  const counts = { admin: 0, kitchen: 0, barista: 0, cashier: 0 }
  users.forEach(u => { if (counts[u.role] !== undefined) counts[u.role]++ })

  const openAdd = () => {
    setForm({ username: "", email: "", password: "", role: "" })
    setErrorMsg("")
    setAddOpen(true)
  }

  const openEdit = (u) => {
    setEditUser(u)
    setErrorMsg("")
    setForm({ username: u.username, email: u.email, password: "", role: u.role })
  }

  const handleAdd = async () => {
    if (!form.username || !form.email || !form.password || !form.role) {
      setErrorMsg(t("users.allRequired"))
      return
    }
    setSaving(true)
    setErrorMsg("")
    try {
      await createUser(form)
      setAddOpen(false)
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || t("cashier.submitFailed"))
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!form.username?.trim() || !form.email?.trim() || !form.role) {
      setErrorMsg(t("users.allRequired"))
      return
    }
    setSaving(true)
    setErrorMsg("")
    try {
      const payload = { username: form.username.trim(), email: form.email.trim(), role: form.role }
      if (form.password) payload.password = form.password
      await updateUser(editUser.user_id, payload)
      setEditUser(null)
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || t("cashier.submitFailed"))
    } finally {
      setSaving(false)
    }
  }

  // Deleting is destructive and irreversible, so it goes through a
  // confirmation modal instead of firing immediately on click.
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  const requestDelete = (id) => {
    setDeleteError("")
    const item = users.find(x => x.user_id === id)
    setDeleteTarget(item || { user_id: id })
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError("")
    try {
      await deleteUser(deleteTarget.user_id)
      setDeleteTarget(null)
    } catch (err) {
      setDeleteError(deleteErrorMessage(err, t))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-5">
      <SimpleHeader title={t("nav.users")}
        subtitle={t("users.manageSubtitle")}
        action={<Button onClick={openAdd} className="gap-2"><Plus size={15} /> {t("users.addUser")}</Button>} />

      <UserStats users={users} counts={counts} />

      <UsersTable
        users={filtered} isLoading={isLoading}
        search={search} setSearch={setSearch}
        roleFilter={roleFilter} setRoleFilter={setRoleFilter}
        currentUser={currentUser} onEdit={openEdit} onDelete={requestDelete}
      />

      <UserFormDialog
        open={addOpen} onClose={() => setAddOpen(false)} isEdit={false}
        title={t("users.addUser")} description={t("users.subtitle")}
        form={form} setForm={setForm} errorMsg={errorMsg} saving={saving}
        onSubmit={handleAdd} submitLabel={t("users.addUser")}
      />

      <UserFormDialog
        open={!!editUser} onClose={() => setEditUser(null)} isEdit
        title={t("users.editUser")} description={t("users.editSub")}
        form={form} setForm={setForm} errorMsg={errorMsg} saving={saving}
        onSubmit={handleUpdate} submitLabel={t("users.updateUser")}
      />
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        busy={deleting}
        danger
        title={t("users.deleteTitle")}
        message={t("users.deleteMsg")}
        confirmLabel={t("common.delete")}
        errorMsg={deleteError}
      />
    </div>
  )
}
